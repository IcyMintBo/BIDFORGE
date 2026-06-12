import type {
  CloudProviderStatus,
  CodexProviderCheck,
  DefaultProviderPlaceholderResult,
  OpenAiProviderConfigInput,
  OpenAiProviderConfigSaveResult,
  OpenAiProviderModelsResult,
  OpenAiProviderStatus,
  OpenAiProviderTestResult,
  ProviderConfigStatus,
} from "../types/providerConfig";

const RUNNER_API_BASE_URL = import.meta.env.VITE_RUNNER_API_BASE_URL ?? "http://localhost:8787";

async function readJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${RUNNER_API_BASE_URL}${path}`, options);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Provider 配置读取失败：HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Provider 配置接口返回格式不正确。");
  }

  return payload as T;
}

export function getProviderConfigStatus(): Promise<ProviderConfigStatus> {
  return readJson<ProviderConfigStatus>("/api/providers/status");
}

export function checkCodexProvider(): Promise<CodexProviderCheck> {
  return readJson<CodexProviderCheck>("/api/providers/codex/check");
}

export function getOpenAiProviderStatus(): Promise<OpenAiProviderStatus> {
  return readJson<OpenAiProviderStatus>("/api/providers/openai/status");
}

export function saveOpenAiProviderConfig(input: OpenAiProviderConfigInput): Promise<OpenAiProviderConfigSaveResult> {
  return readJson<OpenAiProviderConfigSaveResult>("/api/providers/openai/config", {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function fetchOpenAiProviderModels(input: OpenAiProviderConfigInput): Promise<OpenAiProviderModelsResult> {
  return readJson<OpenAiProviderModelsResult>("/api/providers/openai/models", {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function testOpenAiProviderConnection(input: OpenAiProviderConfigInput): Promise<OpenAiProviderTestResult> {
  return readJson<OpenAiProviderTestResult>("/api/providers/openai/test", {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function getCloudProviderStatus(): Promise<CloudProviderStatus> {
  return readJson<CloudProviderStatus>("/api/providers/cloud/status");
}

export function setDefaultProvider(providerId: string): Promise<DefaultProviderPlaceholderResult> {
  return readJson<DefaultProviderPlaceholderResult>("/api/providers/default", {
    body: JSON.stringify({ providerId }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}
