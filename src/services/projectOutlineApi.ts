const RUNNER_API_BASE_URL = import.meta.env.VITE_RUNNER_API_BASE_URL ?? "http://localhost:8787";

export interface ProjectOutlineStatus {
  projectId: string;
  exists: boolean;
  confirmed: boolean;
  confirmedAt: string | null;
  outlineSource: string;
  outlinePath: string;
  outlineAbsolutePath: string;
  apiCalled: boolean;
  model: string;
  candidateFiles: Array<{
    id: string;
    name: string;
    type: string;
    path?: string;
  }>;
}

export interface ProjectOutlineBuildResult {
  status: "success";
  projectId: string;
  outlinePath: string;
  outlineAbsolutePath: string;
  outlineSource: "uploaded_file" | "api_generated";
  lineCount: number;
  confirmed: boolean;
  apiCalled?: boolean;
  model?: string;
  message: string;
}

interface FailedProjectOutlineResponse {
  status: "failed";
  error: string;
  detail?: string;
  reason?: string;
}

function isFailedProjectOutlineResponse(value: unknown): value is FailedProjectOutlineResponse {
  return Boolean(value && typeof value === "object" && "status" in value && value.status === "failed");
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function throwProjectOutlineError(payload: unknown, fallback: string): never {
  if (isFailedProjectOutlineResponse(payload)) {
    throw new Error(payload.detail ? `${payload.error} ${payload.detail}` : payload.error);
  }

  throw new Error(fallback);
}

export async function getProjectOutlineStatus(projectId: string): Promise<ProjectOutlineStatus> {
  const response = await fetch(`${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/outline/status`);
  const payload = await readJson(response);

  if (!response.ok) {
    throwProjectOutlineError(payload, `章节大纲状态读取失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("exists" in payload)) {
    throw new Error("章节大纲状态接口返回格式不正确。");
  }

  return payload as ProjectOutlineStatus;
}

export async function buildProjectOutlineFromUpload(projectId: string): Promise<ProjectOutlineBuildResult> {
  const response = await fetch(`${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/outline/build-from-upload`, {
    method: "POST",
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throwProjectOutlineError(payload, `章节大纲读取失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("outlinePath" in payload)) {
    throw new Error("章节大纲读取接口返回格式不正确。");
  }

  return payload as ProjectOutlineBuildResult;
}

export async function generateProjectOutline(projectId: string): Promise<ProjectOutlineBuildResult> {
  const response = await fetch(`${RUNNER_API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/outline/generate`, {
    method: "POST",
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throwProjectOutlineError(payload, `章节大纲生成失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("outlinePath" in payload)) {
    throw new Error("章节大纲生成接口返回格式不正确。");
  }

  return payload as ProjectOutlineBuildResult;
}
