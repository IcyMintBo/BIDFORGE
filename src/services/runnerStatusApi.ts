import type { RunnerStatus } from "../types/runnerStatus";

const RUNNER_API_BASE_URL = import.meta.env.VITE_RUNNER_API_BASE_URL ?? "http://localhost:8787";

export async function getRunnerStatus(): Promise<RunnerStatus> {
  const response = await fetch(`${RUNNER_API_BASE_URL}/api/runner/status`, {
    method: "GET",
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    throw new Error(`本地 Runner 状态读取失败：HTTP ${response.status}`);
  }

  if (!payload || typeof payload !== "object" || !("status" in payload)) {
    throw new Error("本地 Runner 状态返回格式不正确。");
  }

  return payload as RunnerStatus;
}
