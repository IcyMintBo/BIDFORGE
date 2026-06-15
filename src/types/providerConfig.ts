export type ProviderConfigId = "mock" | "local_codex" | "local_openai" | "openai_compatible" | "cloud_api";

export type ProviderConfigStatusValue = "available" | "placeholder" | "not_configured" | "future" | string;

export interface ProviderConfigItem {
  id: ProviderConfigId | string;
  legacyProviderId?: "mock" | "codex" | "openai" | string;
  name: string;
  type: ProviderConfigId | string;
  status: ProviderConfigStatusValue;
  realAi: boolean;
  requiresApiKey: boolean;
  configured: boolean;
  detectable?: boolean;
  executionTimeoutSeconds?: number;
  description: string;
  keySource?: string;
  displayFullKey?: boolean;
  apiConfig?: {
    baseUrl: string;
    model: string;
    maxOutputTokens: number;
    temperature: number;
  };
}

export interface ProviderConfigStatus {
  defaultProvider: "mock" | string;
  principle: string;
  providers: ProviderConfigItem[];
  production: false;
  productionRc: false;
  realAi: false;
}

export interface CodexProviderCheck {
  id: "local_codex" | string;
  name: string;
  status: "placeholder" | string;
  detected: boolean;
  version: string;
  supportsNonInteractive: boolean;
  executionTimeoutSeconds?: number;
  realAi: boolean;
  configured: boolean;
  message: string;
  error?: string;
}

export interface OpenAiProviderStatus {
  id: "openai_compatible" | "local_openai" | string;
  name: string;
  status: "not_configured" | "placeholder" | string;
  realAi: boolean;
  requiresApiKey: true;
  configured: boolean;
  keyConfigured: boolean;
  keySource: string;
  displayFullKey: false;
  baseUrl: string;
  model: string;
  maxOutputTokens: number;
  temperature: number;
  message: string;
}

export interface OpenAiProviderConfigInput {
  baseUrl: string;
  apiKey?: string;
  model: string;
  maxOutputTokens: number;
  temperature: number;
}

export interface OpenAiProviderConfigSaveResult {
  saved: true;
  targetPath: string;
  keyUpdated: boolean;
  keyConfigured: boolean;
  displayFullKey: false;
  status: OpenAiProviderStatus;
  message: string;
}

export interface OpenAiProviderModel {
  id: string;
  ownedBy?: string;
  created?: number | null;
}

export interface OpenAiProviderModelsResult {
  status: "success";
  source: "GET /models";
  baseUrl: string;
  keyConfigured: true;
  models: OpenAiProviderModel[];
  count: number;
  durationMs: number;
  message: string;
}

export interface OpenAiProviderTestResult {
  status: "success";
  source: "POST /chat/completions";
  baseUrl: string;
  model: string;
  keyConfigured: true;
  durationMs: number;
  usage: {
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
  };
  outputPreview: string;
  tokenLimitParam?: "max_tokens" | "max_completion_tokens" | string;
  requestPayloadDebug?: {
    model?: string;
    messages?: Array<{
      role: string;
      content: string;
    }>;
    max_tokens?: number;
    max_completion_tokens?: number;
    stream?: boolean;
  };
  message: string;
}

export interface CloudProviderStatus {
  id: "cloud_api" | string;
  name: string;
  status: "future" | string;
  realAi: false;
  configured: false;
  available: false;
  message: string;
}

export interface DefaultProviderPlaceholderResult {
  defaultProvider: "mock" | string;
  requestedProvider: string;
  saved: false;
  message: string;
  production: false;
  productionRc: false;
}
