import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import * as xlsx from "xlsx";
import { listProjectFiles } from "./projectFiles.js";
import { normalizeOpenAiCompatibleBaseUrl } from "../utils/openAiCompatibleBaseUrl.js";
import { safeFileName } from "../utils/safeFileName.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const projectsRoot = path.join(projectRoot, "projects");
const outlineKeywords = ["大纲", "目录", "技术标目录", "响应文件目录", "章节结构", "章节目录", "outline", "contents", "toc"];
const apiOutlineTimeoutMs = 60000;
const sourceMaterialsMaxChars = 12000;

function getProjectDir(projectId) {
  return path.join(projectsRoot, safeFileName(projectId, "project"));
}

function getOutlineDir(projectId) {
  return path.join(getProjectDir(projectId), "outline");
}

function getChapterOutlinePath(projectId) {
  return path.join(getOutlineDir(projectId), "chapter_outline.md");
}

function getOutlineManifestPath(projectId) {
  return path.join(getOutlineDir(projectId), "outline_manifest.json");
}

function getProjectSourceMaterialsPath(projectId) {
  return path.join(getProjectDir(projectId), "materials", "source_materials.md");
}

function toProjectRelativePath(absolutePath) {
  return path.relative(projectRoot, absolutePath).replaceAll(path.sep, "/");
}

function isPathInside(parent, child) {
  const relative = path.relative(parent, child);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function readJsonFile(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function readOutlineManifest(projectId) {
  return readJsonFile(getOutlineManifestPath(projectId));
}

async function writeOutlineManifest(projectId, manifest) {
  await mkdir(getOutlineDir(projectId), { recursive: true });
  await writeFile(getOutlineManifestPath(projectId), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function isOutlineCandidate(file) {
  const value = `${file.name ?? ""} ${file.path ?? ""}`.toLowerCase();
  return outlineKeywords.some((keyword) => value.includes(keyword.toLowerCase()));
}

async function extractPdfText(absolutePath) {
  const buffer = await readFile(absolutePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(absolutePath) {
  const result = await mammoth.extractRawText({ path: absolutePath });
  return result.value ?? "";
}

function extractWorkbookText(absolutePath) {
  const workbook = xlsx.readFile(absolutePath, { cellDates: true });
  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = xlsx.utils.sheet_to_csv(sheet, { FS: "\t" });
    return `# Sheet: ${sheetName}\n${csv}`;
  }).join("\n\n");
}

async function extractTextFromFile(file, absolutePath) {
  const extension = path.extname(file.name || absolutePath).toLowerCase();

  if (extension === ".md" || extension === ".txt") {
    return readFile(absolutePath, "utf8");
  }

  if (extension === ".pdf") {
    return extractPdfText(absolutePath);
  }

  if (extension === ".docx") {
    return extractDocxText(absolutePath);
  }

  if (extension === ".xlsx" || extension === ".xls") {
    return extractWorkbookText(absolutePath);
  }

  const error = new Error("当前大纲文件类型暂不支持自动解析，请上传 PDF、DOCX、XLSX、MD 或 TXT。");
  error.statusCode = 400;
  throw error;
}

function normalizeText(text) {
  return String(text ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function pickOutlineLines(text) {
  const lines = normalizeText(text)
    .split(/\n+/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  const outlinePattern =
    /^((第[一二三四五六七八九十百0-9]+[章节篇])|([0-9]+(\.[0-9]+){0,4})|([一二三四五六七八九十]+[、.．])|([（(][一二三四五六七八九十0-9]+[）)]))/;
  const picked = lines.filter((line) => line.length <= 180 && (outlinePattern.test(line) || /建筑设计|设计说明|专业|章节|目录/.test(line)));

  return (picked.length >= 3 ? picked : lines.filter((line) => line.length <= 180).slice(0, 80)).slice(0, 160);
}

function renderOutlineMarkdown({ projectId, generatedAt, source, sourceFile, outlineLines, apiCalled, model }) {
  const outlineText = outlineLines.length > 0 ? outlineLines.map((line) => `- ${line}`).join("\n") : "- 暂未识别到清晰章节条目。";

  return `# BIDFORGE Chapter Outline

## 1. 生成信息

- projectId：${projectId}
- generatedAt：${generatedAt}
- outlineSource：${source}
- sourceFile：${sourceFile || "无"}
- apiCalled：${apiCalled ? "是" : "否"}
- model：${model || "无"}
- Production：否
- Production RC：否

## 2. 章节大纲

${outlineText}

## 3. 使用说明

- 本文件用于确认后续标书正文的章节结构。
- 后续草稿、写作计划、扩写和审查应优先读取本大纲。
- 如大纲不完整，请先补充或重新生成，不要直接进入正式写稿。
`;
}

function getApiKey() {
  return (
    process.env.BIDFORGE_API_KEY ||
    process.env.BIDFORGE_OPENAI_COMPATIBLE_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.BIDFORGE_OPENAI_API_KEY ||
    ""
  );
}

function getApiConfig() {
  return {
    baseUrl: normalizeOpenAiCompatibleBaseUrl(process.env.BIDFORGE_API_BASE_URL ?? process.env.BIDFORGE_OPENAI_COMPATIBLE_BASE_URL ?? ""),
    apiKey: getApiKey(),
    model: process.env.BIDFORGE_API_MODEL ?? process.env.BIDFORGE_OPENAI_COMPATIBLE_MODEL ?? "",
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = apiOutlineTimeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function getChatContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content.map((part) => (typeof part?.text === "string" ? part.text : "")).join("").trim();
  }

  return "";
}

function createProjectOutlineError(message, statusCode = 500, extra = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extra);
  return error;
}

async function writeOutlineFiles(projectId, manifest, outlineMarkdown) {
  const outlinePath = getChapterOutlinePath(projectId);
  await mkdir(getOutlineDir(projectId), { recursive: true });
  await Promise.all([
    writeFile(outlinePath, `${outlineMarkdown.trim()}\n`, "utf8"),
    writeOutlineManifest(projectId, manifest),
  ]);
}

async function getOutlineCandidateFiles(projectId) {
  const { files } = await listProjectFiles(projectId);
  return files.filter(isOutlineCandidate);
}

export async function getProjectOutlineStatus(projectId) {
  const manifest = await readOutlineManifest(projectId);
  const candidateFiles = await getOutlineCandidateFiles(projectId);
  let exists = false;

  try {
    await readFile(getChapterOutlinePath(projectId), "utf8");
    exists = true;
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  return {
    projectId,
    exists,
    confirmed: Boolean(manifest?.confirmed),
    confirmedAt: manifest?.confirmedAt ?? null,
    outlineSource: manifest?.outlineSource ?? "",
    outlinePath: exists ? toProjectRelativePath(getChapterOutlinePath(projectId)) : "",
    outlineAbsolutePath: exists ? getChapterOutlinePath(projectId) : "",
    apiCalled: Boolean(manifest?.apiCalled),
    model: manifest?.model ?? "",
    candidateFiles: candidateFiles.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      path: file.path,
    })),
  };
}

export async function buildProjectOutlineFromUpload(projectId) {
  const candidateFiles = await getOutlineCandidateFiles(projectId);
  if (candidateFiles.length === 0) {
    throw createProjectOutlineError("未检测到大纲文件，请先上传文件名包含“大纲”或“目录”的大纲文件。", 404, {
      reason: "missing_outline_file",
    });
  }

  const sourceFile = candidateFiles[candidateFiles.length - 1];
  const absolutePath = path.resolve(projectRoot, sourceFile.path ?? "");
  const projectDir = getProjectDir(projectId);

  if (!sourceFile.path || !isPathInside(projectDir, absolutePath)) {
    throw createProjectOutlineError("大纲文件路径不在当前项目目录内，已阻止读取。", 400);
  }

  const rawText = await extractTextFromFile(sourceFile, absolutePath);
  const outlineLines = pickOutlineLines(rawText);
  const generatedAt = new Date().toISOString();
  const outlinePath = getChapterOutlinePath(projectId);
  const manifest = {
    projectId,
    generatedAt,
    confirmed: false,
    confirmedAt: null,
    confirmedBy: "",
    outlineSource: "uploaded_file",
    sourceFile: sourceFile.name,
    sourceFilePath: sourceFile.path,
    apiCalled: false,
    model: "",
    outlinePath: toProjectRelativePath(outlinePath),
    outlineAbsolutePath: outlinePath,
    stats: {
      lineCount: outlineLines.length,
      sourceCharCount: normalizeText(rawText).length,
    },
    production: false,
    productionRc: false,
  };

  await writeOutlineFiles(
    projectId,
    manifest,
    renderOutlineMarkdown({
      projectId,
      generatedAt,
      source: "uploaded_file",
      sourceFile: sourceFile.name,
      outlineLines,
      apiCalled: false,
      model: "",
    }),
  );

  return {
    status: "success",
    projectId,
    outlinePath: manifest.outlinePath,
    outlineAbsolutePath: manifest.outlineAbsolutePath,
    outlineSource: manifest.outlineSource,
    lineCount: outlineLines.length,
    confirmed: false,
    message: `已从 ${sourceFile.name} 生成章节大纲。`,
  };
}

export async function generateProjectOutlineWithApi(projectId) {
  const config = getApiConfig();
  if (!config.baseUrl) {
    throw createProjectOutlineError("Base URL 未配置，无法调用 API 生成章节大纲。", 400);
  }

  if (!config.apiKey) {
    throw createProjectOutlineError("API Key 未配置，无法调用 API 生成章节大纲。", 400);
  }

  if (!config.model) {
    throw createProjectOutlineError("Model 未配置，无法调用 API 生成章节大纲。", 400);
  }

  let sourceMaterials = "";
  try {
    sourceMaterials = await readFile(getProjectSourceMaterialsPath(projectId), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw createProjectOutlineError("未找到 source_materials.md，请先点击“整理资料”。", 400);
    }

    throw error;
  }

  const prompt = `请根据以下 BIDFORGE 项目资料，生成一版投标文件章节大纲建议。

要求：
1. 只输出 Markdown 大纲；
2. 层级清楚，章节标题正式；
3. 不编造项目事实；
4. 标出“需人工确认”的高风险或不确定章节；
5. 不进入 Production / Production RC。

项目资料：

${sourceMaterials.slice(0, sourceMaterialsMaxChars)}`;
  const endpoint = `${config.baseUrl}/chat/completions`;
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content: "你是 BIDFORGE 的投标文件大纲整理助手，只输出 Markdown 大纲，不解释过程。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1200,
      stream: false,
    }),
  });
  const bodyText = await response.text();
  let payload;

  try {
    payload = bodyText ? JSON.parse(bodyText) : undefined;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    throw createProjectOutlineError(`API 生成章节大纲失败：HTTP ${response.status}。`, response.status, {
      detail: String(bodyText ?? "").slice(0, 500),
    });
  }

  const markdown = getChatContent(payload);
  if (!markdown) {
    throw createProjectOutlineError("API 返回为空，未生成章节大纲。", 502);
  }

  const generatedAt = new Date().toISOString();
  const outlinePath = getChapterOutlinePath(projectId);
  const manifest = {
    projectId,
    generatedAt,
    confirmed: false,
    confirmedAt: null,
    confirmedBy: "",
    outlineSource: "api_generated",
    sourceFile: "",
    sourceFilePath: "",
    apiCalled: true,
    model: config.model,
    outlinePath: toProjectRelativePath(outlinePath),
    outlineAbsolutePath: outlinePath,
    stats: {
      lineCount: markdown.split(/\n+/).filter(Boolean).length,
      sourceCharCount: sourceMaterials.length,
    },
    usage: payload?.usage ?? null,
    production: false,
    productionRc: false,
  };
  const outlineMarkdown = `# BIDFORGE Chapter Outline

## 1. 生成信息

- projectId：${projectId}
- generatedAt：${generatedAt}
- outlineSource：api_generated
- apiCalled：是
- model：${config.model}
- Production：否
- Production RC：否

## 2. 章节大纲

${markdown.trim()}

## 3. 使用说明

- 本文件由 API 根据当前 source_materials 生成，请在确认资料前人工快速检查。
- 后续草稿、写作计划、扩写和审查应优先读取本大纲。
`;

  await writeOutlineFiles(projectId, manifest, outlineMarkdown);

  return {
    status: "success",
    projectId,
    outlinePath: manifest.outlinePath,
    outlineAbsolutePath: manifest.outlineAbsolutePath,
    outlineSource: manifest.outlineSource,
    lineCount: manifest.stats.lineCount,
    confirmed: false,
    apiCalled: true,
    model: config.model,
    message: "已调用 API 生成建议章节大纲。",
  };
}

export async function confirmProjectOutline(projectId) {
  const manifest = await readOutlineManifest(projectId);
  if (!manifest) {
    throw createProjectOutlineError("未找到章节大纲，请先上传大纲或生成建议大纲。", 409, {
      reason: "missing_outline",
    });
  }

  const confirmedAt = new Date().toISOString();
  const nextManifest = {
    ...manifest,
    confirmed: true,
    confirmedAt,
    confirmedBy: "local_user",
  };

  await writeOutlineManifest(projectId, nextManifest);

  return {
    projectId,
    confirmed: true,
    confirmedAt,
    outlinePath: nextManifest.outlinePath ?? toProjectRelativePath(getChapterOutlinePath(projectId)),
  };
}

export async function ensureProjectOutlineReady(projectId) {
  const status = await getProjectOutlineStatus(projectId);
  if (!status.exists) {
    throw createProjectOutlineError("未检测到章节大纲，请先上传大纲文件或调用 API 生成建议大纲。", 409, {
      reason: "missing_outline",
      outlineStatus: status,
    });
  }

  return status;
}
