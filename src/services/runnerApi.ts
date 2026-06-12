import type { RunnerReadResult, RunnerTaskInput, RunnerTaskResult } from "../types/runner";

const RUNNER_API_BASE_URL = import.meta.env.VITE_RUNNER_API_BASE_URL ?? "http://localhost:8787";
const RUNNER_CONNECTION_ERROR =
  "无法连接本地 Runner。请确认已在项目根目录运行 npm run server，并确认 http://localhost:8787/api/health 可访问。";
const FALLBACK_NOTICE = "本地 Runner 未连接，当前使用前端 mock 结果。";

interface FailedRunnerResponse {
  status: "failed";
  error: string;
}

function isFailedRunnerResponse(value: unknown): value is FailedRunnerResponse {
  return Boolean(value && typeof value === "object" && "status" in value && value.status === "failed");
}

function createFallbackMarkdown(input: RunnerTaskInput): string {
  return `# ${input.sectionId} ${input.sectionTitle}

> ${FALLBACK_NOTICE}

## 当前阶段说明

本次结果由 BIDFORGE 前端 fallback mock 生成，用于在本地 Runner 未启动时继续验证页面状态、Markdown 预览和下载流程。

请启动本地 Runner 后重新点击“生成精简稿”，即可写入真实 runs 目录并返回后端生成的 Markdown。

## Candidate Skill 摘要

- Writing v0.3：bidforge-writing-candidate-v0.3
- Expansion v0.3：bidforge-expansion-candidate-v0.3
- 未进入 Production
- 未进入 Production RC`;
}

function createFallbackResult(input: RunnerTaskInput): RunnerTaskResult {
  const createdAt = new Date().toISOString();

  return {
    taskId: `frontend-mock-${Date.now()}`,
    status: "success",
    markdown: createFallbackMarkdown(input),
    fileName: `${input.sectionId}-${input.sectionTitle}-compact-draft.md`,
    createdAt,
    runnerMode: "frontend_mock",
    warning: `${RUNNER_CONNECTION_ERROR} ${FALLBACK_NOTICE}`,
    provider: "mock",
    providerName: "Frontend Mock Fallback",
    modelName: "bidforge-frontend-mock",
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
    manifestSummary: {
      writingSkill: "bidforge-writing-candidate-v0.3",
      expansionSkill: "bidforge-expansion-candidate-v0.3",
      production: false,
      productionRc: false,
    },
  };
}

export async function generateCompactSection(input: RunnerTaskInput): Promise<RunnerTaskResult> {
  let response: Response;

  try {
    response = await fetch(`${RUNNER_API_BASE_URL}/api/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  } catch {
    if ((input.provider ?? "mock") === "mock") {
      return createFallbackResult(input);
    }

    throw new Error(RUNNER_CONNECTION_ERROR);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    if (isFailedRunnerResponse(payload)) {
      throw new Error(payload.error);
    }

    throw new Error(`本地 Runner 请求失败：HTTP ${response.status}`);
  }

  if (isFailedRunnerResponse(payload)) {
    throw new Error(payload.error);
  }

  if (!payload || typeof payload !== "object" || !("markdown" in payload)) {
    throw new Error("本地 Runner 返回格式不正确。");
  }

  return {
    ...(payload as RunnerTaskResult),
    runnerMode: "local_api",
  };
}

export async function readCodexWorkspaceResult(runDir: string): Promise<RunnerReadResult> {
  let response: Response;

  try {
    response = await fetch(`${RUNNER_API_BASE_URL}/api/runs/result?runDir=${encodeURIComponent(runDir)}`);
  } catch {
    throw new Error(RUNNER_CONNECTION_ERROR);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    if (isFailedRunnerResponse(payload)) {
      throw new Error(payload.error);
    }

    throw new Error(`读取 Codex 结果失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("markdown" in payload)) {
    throw new Error("本地 Runner 返回的 Codex 结果格式不正确。");
  }

  return payload as RunnerReadResult;
}
