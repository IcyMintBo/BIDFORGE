import * as codexProvider from "./codexProvider.js";
import * as mockProvider from "./mockProvider.js";
import * as openaiProvider from "./openaiProvider.js";

export const DEFAULT_PROVIDER = "mock";

const providers = {
  mock: mockProvider,
  local_codex: codexProvider,
  local_openai: openaiProvider,
  openai_compatible: openaiProvider,
};

const providerAliases = {
  codex: "local_codex",
  openai: "local_openai",
  openai_compatible_api: "openai_compatible",
};

export function normalizeProviderName(providerName) {
  const normalized = String(providerName ?? DEFAULT_PROVIDER)
    .trim()
    .toLowerCase();
  const key = normalized || DEFAULT_PROVIDER;

  return providerAliases[key] ?? key;
}

export function getProvider(providerName) {
  const key = normalizeProviderName(providerName);
  const provider = providers[key];

  if (!provider) {
    const error = new Error(`未知 Provider：${providerName}。当前支持：mock、local_codex、local_openai。`);
    error.statusCode = 400;
    throw error;
  }

  return {
    key,
    provider,
  };
}

export function getSupportedProviders() {
  return Object.keys(providers);
}
