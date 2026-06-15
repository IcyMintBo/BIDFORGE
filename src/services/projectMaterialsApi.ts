const RUNNER_API_BASE_URL = import.meta.env.VITE_RUNNER_API_BASE_URL ?? "http://localhost:8787";

export interface ProjectMaterialsBuildResult {
  status: "success";
  projectId: string;
  generatedAt: string;
  materialDir: string;
  materialDirAbsolute: string;
  materialLevel?: "raw" | "refined";
  aiCalled?: boolean;
  rawExtractPath?: string;
  rawExtractAbsolutePath?: string;
  sourceMaterialsPath: string;
  sourceMaterialsAbsolutePath: string;
  sourceMaterialsRefinedPath?: string;
  sourceMaterialsRefinedAbsolutePath?: string;
  evidenceMapPath?: string;
  evidenceMapAbsolutePath?: string;
  manifestPath: string;
  manifestAbsolutePath: string;
  files: {
    totalFiles: number;
    loadedFiles: number;
    unsupportedFiles: number;
    failedFiles: number;
    totalExtractedChars: number;
    factCount: number;
  };
  message: string;
}

export interface ProjectMaterialsStatus {
  projectId: string;
  exists: boolean;
  generatedAt?: string;
  confirmed: boolean;
  confirmedAt: string | null;
  materialLevel: "none" | "raw" | "refined";
  aiCalled: boolean;
  rawExtractPath: string;
  rawExtractAbsolutePath?: string;
  sourceMaterialsPath: string;
  sourceMaterialsAbsolutePath?: string;
  sourceMaterialsRefinedPath: string;
  sourceMaterialsRefinedAbsolutePath?: string;
  evidenceMapPath: string;
  evidenceMapAbsolutePath?: string;
  files: ProjectMaterialsBuildResult["files"] | null;
}

export interface ProjectMaterialsConfirmResult {
  projectId: string;
  confirmed: true;
  confirmedAt: string;
  sourceMaterialsPath: string;
  message: string;
}

interface FailedProjectMaterialsResponse {
  status: "failed";
  error: string;
}

function isFailedProjectMaterialsResponse(value: unknown): value is FailedProjectMaterialsResponse {
  return Boolean(value && typeof value === "object" && "status" in value && value.status === "failed");
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function buildProjectMaterials(projectId: string): Promise<ProjectMaterialsBuildResult> {
  const response = await fetch(`${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/materials/build`, {
    method: "POST",
  });
  const payload = await readJson(response);

  if (!response.ok) {
    if (isFailedProjectMaterialsResponse(payload)) {
      throw new Error(payload.error);
    }

    throw new Error(`项目资料整理失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("sourceMaterialsPath" in payload)) {
    throw new Error("项目资料整理接口返回格式不正确。");
  }

  return payload as ProjectMaterialsBuildResult;
}

export async function refineProjectMaterials(projectId: string): Promise<ProjectMaterialsBuildResult> {
  const response = await fetch(`${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/materials/refine`, {
    method: "POST",
  });
  const payload = await readJson(response);

  if (!response.ok) {
    if (isFailedProjectMaterialsResponse(payload)) {
      throw new Error(payload.error);
    }

    throw new Error(`AI 资料精炼失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("sourceMaterialsPath" in payload)) {
    throw new Error("AI 资料精炼接口返回格式不正确。");
  }

  return payload as ProjectMaterialsBuildResult;
}

export async function getProjectMaterialsStatus(projectId: string): Promise<ProjectMaterialsStatus> {
  const response = await fetch(`${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/materials/status`);
  const payload = await readJson(response);

  if (!response.ok) {
    if (isFailedProjectMaterialsResponse(payload)) {
      throw new Error(payload.error);
    }

    throw new Error(`资料状态读取失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("confirmed" in payload)) {
    throw new Error("资料状态接口返回格式不正确。");
  }

  return payload as ProjectMaterialsStatus;
}

export async function confirmProjectMaterials(projectId: string): Promise<ProjectMaterialsConfirmResult> {
  const response = await fetch(`${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/materials/confirm`, {
    method: "POST",
  });
  const payload = await readJson(response);

  if (!response.ok) {
    if (isFailedProjectMaterialsResponse(payload)) {
      throw new Error(payload.error);
    }

    throw new Error(`资料确认失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("confirmedAt" in payload)) {
    throw new Error("资料确认接口返回格式不正确。");
  }

  return payload as ProjectMaterialsConfirmResult;
}

export async function openProjectMaterialsFolder(projectId: string): Promise<string> {
  const response = await fetch(`${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/materials-folder/open`, {
    method: "POST",
  });
  const payload = await readJson(response);

  if (!response.ok) {
    if (isFailedProjectMaterialsResponse(payload)) {
      throw new Error(payload.error);
    }

    throw new Error(`资料文件夹打开失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("materialsDir" in payload)) {
    throw new Error("资料文件夹打开接口返回格式不正确。");
  }

  return String((payload as { materialsDir: string }).materialsDir);
}
