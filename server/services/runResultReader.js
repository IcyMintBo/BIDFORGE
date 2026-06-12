import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const runsRoot = path.join(projectRoot, "runs");
const taskPackPlaceholderMarker = "<!-- BIDFORGE_TASK_PACK_PLACEHOLDER -->";
const legacyPlaceholderHeadings = ["# Codex Workspace 任务包已生成", "# Dry Run / 任务包已生成", "# API Run 准备完成"];

function normalizeRunDir(runDir) {
  const value = String(runDir ?? "").replaceAll("\\", "/").replace(/^\/+/, "");
  if (!value.startsWith("runs/")) {
    const error = new Error("runDir 必须位于 runs/ 目录下。");
    error.statusCode = 400;
    throw error;
  }

  const absolutePath = path.resolve(projectRoot, value);
  const relativeToRuns = path.relative(runsRoot, absolutePath);
  if (relativeToRuns.startsWith("..") || path.isAbsolute(relativeToRuns)) {
    const error = new Error("runDir 路径非法。");
    error.statusCode = 400;
    throw error;
  }

  return {
    runDir: value,
    runDirAbs: absolutePath,
  };
}

async function listSubsectionDrafts(runDirAbs) {
  const dir = path.join(runDirAbs, "subsection_drafts");

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, "zh-Hans-CN", { numeric: true }));
  } catch {
    return [];
  }
}

function isTaskPackPlaceholder(markdown) {
  const value = String(markdown ?? "").trim();
  return value.includes(taskPackPlaceholderMarker) || legacyPlaceholderHeadings.some((heading) => value.startsWith(heading));
}

function createNotReadyError() {
  const error = new Error(
    "Agent 尚未写入结果：draft.md 仍是任务包占位说明，且 subsection_drafts/ 中未发现可用小节结果。",
  );
  error.statusCode = 404;
  return error;
}

async function readSubsectionDraftFiles(runDirAbs) {
  const dir = path.join(runDirAbs, "subsection_drafts");
  const names = await listSubsectionDrafts(runDirAbs);
  const files = [];

  for (const name of names) {
    const filePath = path.join(dir, name);
    const markdown = (await readFile(filePath, "utf8")).trim();
    if (!markdown || isTaskPackPlaceholder(markdown)) {
      continue;
    }

    const info = await stat(filePath);
    files.push({
      name,
      fileName: path.posix.join("subsection_drafts", name),
      markdown,
      size: info.size,
    });
  }

  return files;
}

function mergeSubsectionDraftFiles(files) {
  return files.map((file) => file.markdown.trim()).filter(Boolean).join("\n\n").trim();
}

async function readDraftFile(draftPath) {
  try {
    const draftInfo = await stat(draftPath);
    const markdown = (await readFile(draftPath, "utf8")).trim();
    return {
      markdown,
      size: draftInfo.size,
      exists: true,
    };
  } catch {
    return {
      markdown: "",
      size: 0,
      exists: false,
    };
  }
}

export async function readRunDraftResult(runDirInput) {
  const { runDir, runDirAbs } = normalizeRunDir(runDirInput);
  const draftPath = path.join(runDirAbs, "draft.md");
  const draft = await readDraftFile(draftPath);
  const subsectionFiles = await readSubsectionDraftFiles(runDirAbs);
  const subsectionDrafts = subsectionFiles.map((file) => file.name);

  if (draft.markdown && !isTaskPackPlaceholder(draft.markdown)) {
    return {
      status: "success",
      runDir,
      markdown: draft.markdown,
      fileName: "draft.md",
      resultSource: "draft.md",
      draftSize: draft.size,
      subsectionDrafts,
      subsectionDraftCount: subsectionFiles.length,
      readAt: new Date().toISOString(),
    };
  }

  if (subsectionFiles.length > 0) {
    const markdown = mergeSubsectionDraftFiles(subsectionFiles);
    return {
      status: "success",
      runDir,
      markdown,
      fileName: "subsection_drafts/*.md",
      resultSource: "subsection_drafts",
      draftSize: subsectionFiles.reduce((sum, file) => sum + file.size, 0),
      subsectionDrafts,
      subsectionDraftCount: subsectionFiles.length,
      readAt: new Date().toISOString(),
    };
  }

  if (draft.exists && !draft.markdown) {
    const error = new Error("draft.md 为空，且 subsection_drafts/ 中未发现可用小节结果。请确认 Agent 已写入正文结果。");
    error.statusCode = 404;
    throw error;
  }

  if (!draft.exists) {
    const error = new Error("draft.md 不存在，且 subsection_drafts/ 中未发现可用小节结果。请先让外部 Agent 完成本次 run。");
    error.statusCode = 404;
    throw error;
  }

  throw createNotReadyError();
}
