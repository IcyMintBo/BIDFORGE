import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { safeFileName } from "../utils/safeFileName.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const projectsRoot = path.join(projectRoot, "projects");

function createTimestamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 17);
}

function createFileId() {
  return `file-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getProjectDir(projectId) {
  return path.join(projectsRoot, safeFileName(projectId, "project"));
}

function getManifestPath(projectId) {
  return path.join(getProjectDir(projectId), "project_files.json");
}

function getInputFilesDir(projectId) {
  return path.join(getProjectDir(projectId), "input_files");
}

function formatDate(value) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${bytes} B`;
}

function detectFileType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".pdf") return "PDF";
  if (extension === ".doc" || extension === ".docx") return "DOCX";
  if (extension === ".xls" || extension === ".xlsx") return "XLSX";
  if (extension === ".md") return "MD";
  if (extension === ".txt") return "TXT";
  return "OTHER";
}

async function readProjectFiles(projectId) {
  try {
    const content = await readFile(getManifestPath(projectId), "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.files) ? parsed.files : [];
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeProjectFiles(projectId, files) {
  await mkdir(getProjectDir(projectId), { recursive: true });
  await writeFile(
    getManifestPath(projectId),
    `${JSON.stringify(
      {
        projectId,
        updatedAt: new Date().toISOString(),
        files,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

function toRelativeProjectPath(projectId, storedName) {
  return path.posix.join("projects", safeFileName(projectId, "project"), "input_files", storedName);
}

function toAbsoluteInputPath(projectId, storedName) {
  return path.join(getInputFilesDir(projectId), storedName);
}

function isPathInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function scanInputFiles(projectId) {
  const inputFilesDir = getInputFilesDir(projectId);

  try {
    const entries = await readdir(inputFilesDir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const storedName = entry.name;
      const absolutePath = toAbsoluteInputPath(projectId, storedName);
      const fileStat = await stat(absolutePath);
      const uploadedAt = fileStat.birthtime.toISOString();

      files.push({
        storedName,
        absolutePath,
        bytes: fileStat.size,
        date: formatDate(uploadedAt),
        uploadedAt,
      });
    }

    return files;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function reconcileProjectFiles(projectId) {
  const manifestFiles = await readProjectFiles(projectId);
  const diskFiles = await scanInputFiles(projectId);
  const manifestByStoredName = new Map(
    manifestFiles
      .map((file) => {
        const storedName = file.storedName || (file.path ? path.basename(file.path) : "");
        return storedName ? [storedName, file] : null;
      })
      .filter(Boolean),
  );

  const reconciled = diskFiles.map((diskFile) => {
    const manifestFile = manifestByStoredName.get(diskFile.storedName);
    if (manifestFile) {
      return {
        ...manifestFile,
        storedName: diskFile.storedName,
        size: formatBytes(diskFile.bytes),
        bytes: diskFile.bytes,
        date: manifestFile.date || diskFile.date,
        uploadedAt: manifestFile.uploadedAt || diskFile.uploadedAt,
        path: toRelativeProjectPath(projectId, diskFile.storedName),
        status: manifestFile.status || "已添加",
      };
    }

    return {
      id: createFileId(),
      name: diskFile.storedName,
      type: detectFileType(diskFile.storedName),
      size: formatBytes(diskFile.bytes),
      bytes: diskFile.bytes,
      date: diskFile.date,
      uploadedAt: diskFile.uploadedAt,
      storedName: diskFile.storedName,
      path: toRelativeProjectPath(projectId, diskFile.storedName),
      status: "已添加",
    };
  });

  const changed =
    reconciled.length !== manifestFiles.length ||
    reconciled.some((file, index) => file.path !== manifestFiles[index]?.path || file.bytes !== manifestFiles[index]?.bytes);

  if (changed) {
    await writeProjectFiles(projectId, reconciled);
  }

  return reconciled;
}

export async function listProjectFiles(projectId) {
  return {
    projectId,
    files: await reconcileProjectFiles(projectId),
  };
}

export async function saveProjectFile({ projectId, originalName, buffer }) {
  if (!projectId || typeof projectId !== "string") {
    const error = new Error("projectId 不能为空。");
    error.statusCode = 400;
    throw error;
  }

  if (!originalName || typeof originalName !== "string") {
    const error = new Error("文件名不能为空。");
    error.statusCode = 400;
    throw error;
  }

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    const error = new Error("上传文件为空。");
    error.statusCode = 400;
    throw error;
  }

  const uploadedAt = new Date().toISOString();
  const inputFilesDir = getInputFilesDir(projectId);
  const storedName = `${createTimestamp()}_${safeFileName(originalName, "file")}`;
  const absolutePath = path.join(inputFilesDir, storedName);
  const relativePath = toRelativeProjectPath(projectId, storedName);

  await mkdir(inputFilesDir, { recursive: true });
  await writeFile(absolutePath, buffer);

  const currentFiles = await readProjectFiles(projectId);
  const nextFile = {
    id: createFileId(),
    name: originalName,
    type: detectFileType(originalName),
    size: formatBytes(buffer.length),
    bytes: buffer.length,
    date: formatDate(uploadedAt),
    uploadedAt,
    storedName,
    path: relativePath,
    status: "已添加",
  };
  const files = [...currentFiles, nextFile];
  await writeProjectFiles(projectId, files);

  return {
    projectId,
    file: nextFile,
    files,
  };
}

export async function deleteProjectFile({ projectId, fileId }) {
  const files = await readProjectFiles(projectId);
  const file = files.find((item) => item.id === fileId);

  if (!file) {
    const error = new Error("未找到要删除的项目文件。");
    error.statusCode = 404;
    throw error;
  }

  const storedName = file.storedName || (file.path ? path.basename(file.path) : "");
  if (!storedName) {
    const error = new Error("文件路径记录不完整，无法删除。");
    error.statusCode = 400;
    throw error;
  }

  const inputFilesDir = getInputFilesDir(projectId);
  const absolutePath = toAbsoluteInputPath(projectId, storedName);
  if (!isPathInside(inputFilesDir, absolutePath)) {
    const error = new Error("文件路径越界，已阻止删除。");
    error.statusCode = 400;
    throw error;
  }

  try {
    await unlink(absolutePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  const nextFiles = files.filter((item) => item.id !== fileId);
  await writeProjectFiles(projectId, nextFiles);

  return {
    projectId,
    deletedFileId: fileId,
    files: await reconcileProjectFiles(projectId),
  };
}

export async function openProjectInputFolder(projectId) {
  const inputFilesDir = getInputFilesDir(projectId);
  await mkdir(inputFilesDir, { recursive: true });

  const platform = globalThis.process?.platform;
  const command = platform === "win32" ? "explorer.exe" : platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(command, [inputFilesDir], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  return {
    projectId,
    inputFilesDir,
    opened: true,
  };
}
