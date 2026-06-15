import type { ProjectFile } from "../data/mockData";

const RUNNER_API_BASE_URL = import.meta.env.VITE_RUNNER_API_BASE_URL ?? "http://localhost:8787";

interface ProjectFilesResponse {
  projectId: string;
  files: ProjectFile[];
}

interface FailedProjectFilesResponse {
  status: "failed";
  error: string;
}

function isFailedProjectFilesResponse(value: unknown): value is FailedProjectFilesResponse {
  return Boolean(value && typeof value === "object" && "status" in value && value.status === "failed");
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function listProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const response = await fetch(`${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/files`);
  const payload = await readJson(response);

  if (!response.ok) {
    if (isFailedProjectFilesResponse(payload)) {
      throw new Error(payload.error);
    }

    throw new Error(`项目文件读取失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("files" in payload)) {
    throw new Error("项目文件接口返回格式不正确。");
  }

  return (payload as ProjectFilesResponse).files;
}

export async function uploadProjectFile(projectId: string, file: File): Promise<ProjectFile[]> {
  const url = `${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/files?fileName=${encodeURIComponent(file.name)}`;
  const response = await fetch(url, {
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
  });
  const payload = await readJson(response);

  if (!response.ok) {
    if (isFailedProjectFilesResponse(payload)) {
      throw new Error(payload.error);
    }

    throw new Error(`项目文件上传失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("files" in payload)) {
    throw new Error("项目文件上传接口返回格式不正确。");
  }

  return (payload as ProjectFilesResponse).files;
}

export async function uploadProjectFiles(projectId: string, files: File[]): Promise<ProjectFile[]> {
  let latestFiles: ProjectFile[] = [];

  for (const file of files) {
    latestFiles = await uploadProjectFile(projectId, file);
  }

  return latestFiles;
}

export async function deleteProjectFile(projectId: string, fileId: string): Promise<ProjectFile[]> {
  const response = await fetch(
    `${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}`,
    {
      method: "DELETE",
    },
  );
  const payload = await readJson(response);

  if (!response.ok) {
    if (isFailedProjectFilesResponse(payload)) {
      throw new Error(payload.error);
    }

    throw new Error(`项目文件删除失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("files" in payload)) {
    throw new Error("项目文件删除接口返回格式不正确。");
  }

  return (payload as ProjectFilesResponse).files;
}

export async function openProjectInputFolder(projectId: string): Promise<string> {
  const response = await fetch(`${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/input-folder/open`, {
    method: "POST",
  });
  const payload = await readJson(response);

  if (!response.ok) {
    if (isFailedProjectFilesResponse(payload)) {
      throw new Error(payload.error);
    }

    throw new Error(`项目文件夹打开失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("inputFilesDir" in payload)) {
    throw new Error("项目文件夹打开接口返回格式不正确。");
  }

  return String((payload as { inputFilesDir: string }).inputFilesDir);
}
