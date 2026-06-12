import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { defaultTimeoutSeconds } from "../providers/codexProvider.js";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const localEnvPath = path.join(projectRoot, ".env.local");

export const providerPrinciple = "谁本地运行，谁本地配置，谁承担额度。";

const defaultProvider = "mock";

function hasOpenAiKey() {
  return Boolean(
    process.env.BIDFORGE_API_KEY ||
      process.env.BIDFORGE_OPENAI_COMPATIBLE_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.BIDFORGE_OPENAI_API_KEY,
  );
}

function maskKeyStatus() {
  if (!hasOpenAiKey()) {
    return {
      configured: false,
      keySource: "not_configured",
      displayFullKey: false,
    };
  }

  return {
    configured: true,
    keySource: "local_environment",
    displayFullKey: false,
  };
}

function getApiProviderDefaults() {
  return {
    baseUrl: process.env.BIDFORGE_API_BASE_URL ?? process.env.BIDFORGE_OPENAI_COMPATIBLE_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.BIDFORGE_API_MODEL ?? process.env.BIDFORGE_OPENAI_COMPATIBLE_MODEL ?? "gpt-4.1-mini",
    maxOutputTokens: Number(
      process.env.BIDFORGE_API_MAX_OUTPUT_TOKENS ?? process.env.BIDFORGE_OPENAI_COMPATIBLE_MAX_OUTPUT_TOKENS ?? 1000,
    ),
    temperature: Number(process.env.BIDFORGE_API_TEMPERATURE ?? process.env.BIDFORGE_OPENAI_COMPATIBLE_TEMPERATURE ?? 0.4),
  };
}

function normalizeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function assertConfigInput(input) {
  const baseUrl = String(input?.baseUrl ?? "").trim();
  const model = String(input?.model ?? "").trim();
  const maxOutputTokens = normalizeNumber(input?.maxOutputTokens, 1000);
  const temperature = normalizeNumber(input?.temperature, 0.4);
  const apiKey = typeof input?.apiKey === "string" ? input.apiKey.trim() : "";

  for (const [label, value] of [
    ["Base URL", baseUrl],
    ["API Key", apiKey],
    ["Model", model],
  ]) {
    if (/[\r\n]/.test(value)) {
      const error = new Error(`${label} 不能包含换行。`);
      error.statusCode = 400;
      throw error;
    }
  }

  if (!baseUrl) {
    const error = new Error("Base URL 不能为空。");
    error.statusCode = 400;
    throw error;
  }

  try {
    const url = new URL(baseUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("invalid protocol");
    }
  } catch {
    const error = new Error("Base URL 格式不正确。");
    error.statusCode = 400;
    throw error;
  }

  if (!model) {
    const error = new Error("Model 不能为空。");
    error.statusCode = 400;
    throw error;
  }

  if (maxOutputTokens < 1 || maxOutputTokens > 128000) {
    const error = new Error("max_output_tokens 必须在 1 到 128000 之间。");
    error.statusCode = 400;
    throw error;
  }

  if (temperature < 0 || temperature > 2) {
    const error = new Error("temperature 必须在 0 到 2 之间。");
    error.statusCode = 400;
    throw error;
  }

  return {
    baseUrl,
    apiKey,
    model,
    maxOutputTokens,
    temperature,
  };
}

function getOpenAiRuntimeConfig(input = {}) {
  const baseDefaults = getApiProviderDefaults();
  const baseUrl = String(input.baseUrl ?? baseDefaults.baseUrl).trim();
  const apiKey =
    typeof input.apiKey === "string" && input.apiKey.trim()
      ? input.apiKey.trim()
      : process.env.BIDFORGE_API_KEY ||
        process.env.BIDFORGE_OPENAI_COMPATIBLE_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.BIDFORGE_OPENAI_API_KEY ||
        "";
  const model = String(input.model ?? baseDefaults.model).trim();
  const maxOutputTokens = normalizeNumber(input.maxOutputTokens, baseDefaults.maxOutputTokens);
  const temperature = normalizeNumber(input.temperature, baseDefaults.temperature);

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    model,
    maxOutputTokens,
    temperature,
  };
}

function assertConnectionConfig(config, options = {}) {
  if (!config.baseUrl) {
    const error = new Error("Base URL 未配置。");
    error.statusCode = 400;
    throw error;
  }

  try {
    const url = new URL(config.baseUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("invalid protocol");
    }
  } catch {
    const error = new Error("Base URL 格式不正确。");
    error.statusCode = 400;
    throw error;
  }

  if (!config.apiKey) {
    const error = new Error("API Key 未配置。");
    error.statusCode = 400;
    throw error;
  }

  if (options.requireModel && !config.model) {
    const error = new Error("Model 未配置。");
    error.statusCode = 400;
    throw error;
  }
}

function explainHttpStatus(status) {
  if (status === 400) return "请求参数不正确，请检查 Base URL、Model 或接口兼容性。";
  if (status === 401 || status === 403) return "API Key 无效、权限不足或当前账号不可用。";
  if (status === 404) return "接口路径或模型不存在，请检查 Base URL 是否应以 /v1 结尾。";
  if (status === 408) return "请求超时，请稍后重试。";
  if (status === 429) return "请求被限流、额度不足或当前模型不可用。";
  if (status >= 500 && status <= 504) return "模型服务暂时不可用，请稍后重试或切换模型。";
  return "API 请求失败，请检查配置。";
}

function sanitizeProviderBody(bodyText) {
  return String(bodyText ?? "").replace(/\s+/g, " ").slice(0, 500);
}

function createConnectionError(message, statusCode = 500, detail = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.detail = detail;
  return error;
}

function parseModelsPayload(payload) {
  const models = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.models) ? payload.models : [];

  return models
    .map((model) => {
      if (typeof model === "string") {
        return { id: model };
      }

      return {
        id: String(model?.id ?? model?.name ?? "").trim(),
        ownedBy: model?.owned_by ?? model?.ownedBy ?? "",
        created: model?.created ?? null,
      };
    })
    .filter((model) => model.id)
    .sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
}

function getChatContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
}

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return {
      text,
      payload: text ? JSON.parse(text) : undefined,
    };
  } catch {
    return {
      text,
      payload: undefined,
    };
  }
}

async function readEnvLines() {
  try {
    const content = await readFile(localEnvPath, "utf8");
    return content.split(/\r?\n/);
  } catch {
    return [];
  }
}

function setEnvLine(lines, key, value) {
  const pattern = new RegExp(`^\\s*${key}\\s*=`);
  const nextLine = `${key}=${value}`;
  const index = lines.findIndex((line) => pattern.test(line));

  if (index >= 0) {
    return lines.map((line, currentIndex) => (currentIndex === index ? nextLine : line));
  }

  return [...lines.filter((line, index) => line || index < lines.length - 1), nextLine];
}

async function writeOpenAiEnv(config) {
  let lines = await readEnvLines();

  lines = setEnvLine(lines, "BIDFORGE_API_BASE_URL", config.baseUrl);
  lines = setEnvLine(lines, "BIDFORGE_API_MODEL", config.model);
  lines = setEnvLine(lines, "BIDFORGE_API_MAX_OUTPUT_TOKENS", String(config.maxOutputTokens));
  lines = setEnvLine(lines, "BIDFORGE_API_TEMPERATURE", String(config.temperature));

  if (config.apiKey) {
    lines = setEnvLine(lines, "BIDFORGE_API_KEY", config.apiKey);
    process.env.BIDFORGE_API_KEY = config.apiKey;
  }

  await writeFile(localEnvPath, `${lines.join("\n").replace(/\n+$/, "")}\n`, "utf8");

  process.env.BIDFORGE_API_BASE_URL = config.baseUrl;
  process.env.BIDFORGE_API_MODEL = config.model;
  process.env.BIDFORGE_API_MAX_OUTPUT_TOKENS = String(config.maxOutputTokens);
  process.env.BIDFORGE_API_TEMPERATURE = String(config.temperature);
}

function createCodexCommand(args) {
  if (globalThis.process?.platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", "codex", ...args],
    };
  }

  return {
    command: "codex",
    args,
  };
}

function execCodex(args, options = {}) {
  const codexCommand = createCodexCommand(args);

  return execFileAsync(codexCommand.command, codexCommand.args, {
    timeout: 3000,
    windowsHide: true,
    ...options,
  });
}

export function getProviderConfigStatus() {
  const openAiStatus = maskKeyStatus();

  return {
    defaultProvider,
    principle: providerPrinciple,
    providers: [
      {
        id: "mock",
        legacyProviderId: "mock",
        name: "Mock Provider",
        type: "mock",
        status: "available",
        realAi: false,
        requiresApiKey: false,
        configured: true,
        description: "用于开发调试和界面演示，不调用真实 AI。",
      },
      {
        id: "local_codex",
        legacyProviderId: "codex",
        name: "Local Codex Provider",
        type: "local_codex",
        status: "placeholder",
        realAi: true,
        requiresApiKey: false,
        configured: false,
        detectable: true,
        executionTimeoutSeconds: defaultTimeoutSeconds,
        description: "使用当前电脑上的 Codex CLI 生成内容，适合本机使用。",
      },
      {
        id: "openai_compatible",
        legacyProviderId: "openai",
        name: "OpenAI-Compatible API Provider",
        type: "openai_compatible",
        status: openAiStatus.configured ? "configured" : "not_configured",
        realAi: true,
        requiresApiKey: true,
        configured: openAiStatus.configured,
        keySource: openAiStatus.keySource,
        displayFullKey: false,
        apiConfig: getApiProviderDefaults(),
        description: "使用当前电脑配置的 OpenAI-compatible API Key，适合稳定自动生成主线。",
      },
      {
        id: "cloud_api",
        name: "Cloud API Provider",
        type: "cloud_api",
        status: "future",
        realAi: false,
        requiresApiKey: false,
        configured: false,
        description: "未来用于云端统一服务，当前暂未开放。",
      },
    ],
    production: false,
    productionRc: false,
    realAi: false,
  };
}

export async function checkCodexProvider() {
  try {
    const versionResult = await execCodex(["--version"]);
    const helpResult = await execCodex(["exec", "--help"]);

    const helpOutput = `${helpResult.stdout ?? ""}\n${helpResult.stderr ?? ""}`;

    return {
      id: "local_codex",
      name: "Local Codex Provider",
      status: "available",
      detected: true,
      version: String(versionResult.stdout ?? versionResult.stderr ?? "").trim(),
      supportsNonInteractive: helpOutput.includes("Run Codex non-interactively") || helpOutput.includes("codex exec"),
      executionTimeoutSeconds: defaultTimeoutSeconds,
      realAi: true,
      configured: true,
      message: "已检测到 Codex CLI，可用于本机非流式生成。",
    };
  } catch (error) {
    return {
      id: "local_codex",
      name: "Local Codex Provider",
      status: "placeholder",
      detected: false,
      version: "",
      supportsNonInteractive: false,
      executionTimeoutSeconds: defaultTimeoutSeconds,
      realAi: true,
      configured: false,
      message: "未检测到 Codex CLI。请先安装并登录 Codex，或切换其他 Provider。",
      error: error instanceof Error ? error.message : "Codex 检测失败。",
    };
  }
}

export function getOpenAiProviderStatus() {
  const openAiStatus = maskKeyStatus();
  const apiConfig = getApiProviderDefaults();

  return {
    id: "openai_compatible",
    name: "OpenAI-Compatible API Provider",
    status: openAiStatus.configured ? "configured" : "not_configured",
    realAi: true,
    requiresApiKey: true,
    configured: openAiStatus.configured,
    keyConfigured: openAiStatus.configured,
    keySource: openAiStatus.keySource,
    displayFullKey: false,
    baseUrl: apiConfig.baseUrl,
    model: apiConfig.model,
    maxOutputTokens: apiConfig.maxOutputTokens,
    temperature: apiConfig.temperature,
    message: openAiStatus.configured
      ? "已检测到本地 API Key 状态，可用于 Direct Forge 非流式单小节生成。"
      : "当前尚未配置 API Key，Direct Forge 无法执行真实 API 调用。",
  };
}

export async function saveOpenAiProviderConfig(input) {
  const config = assertConfigInput(input);
  await writeOpenAiEnv(config);

  return {
    saved: true,
    targetPath: ".env.local",
    keyUpdated: Boolean(config.apiKey),
    keyConfigured: hasOpenAiKey(),
    displayFullKey: false,
    status: getOpenAiProviderStatus(),
    message: config.apiKey
      ? "OpenAI-Compatible API 配置已保存到本机，完整 Key 不会在前端显示。"
      : "OpenAI-Compatible API 配置已保存到本机，API Key 保持原状态。",
  };
}

export async function fetchOpenAiCompatibleModels(input) {
  const config = getOpenAiRuntimeConfig(input);
  assertConnectionConfig(config);

  const startedAt = Date.now();
  let response;
  let body;

  try {
    response = await fetch(`${config.baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });
    body = await readJsonResponse(response);
  } catch (error) {
    throw createConnectionError(error instanceof Error ? `无法连接模型列表接口：${error.message}` : "无法连接模型列表接口。", 502, {
      source: "GET /models",
    });
  }

  const durationMs = Date.now() - startedAt;
  if (!response.ok) {
    throw createConnectionError(`HTTP ${response.status}：${explainHttpStatus(response.status)}`, response.status, {
      source: "GET /models",
      httpStatus: response.status,
      durationMs,
      providerMessage: sanitizeProviderBody(body.text),
    });
  }

  const models = parseModelsPayload(body.payload);
  if (models.length === 0) {
    throw createConnectionError("模型列表为空或接口返回格式不兼容。", 502, {
      source: "GET /models",
      httpStatus: response.status,
      durationMs,
    });
  }

  return {
    status: "success",
    source: "GET /models",
    baseUrl: config.baseUrl,
    keyConfigured: true,
    models,
    count: models.length,
    durationMs,
    message: `已获取 ${models.length} 个模型。`,
  };
}

export async function testOpenAiCompatibleConnection(input) {
  const config = getOpenAiRuntimeConfig(input);
  assertConnectionConfig(config, { requireModel: true });

  const startedAt = Date.now();
  let response;
  let body;

  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
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
            content: "只输出 BIDFORGE_OK，不要输出任何解释。",
          },
          {
            role: "user",
            content: "请只输出：BIDFORGE_OK",
          },
        ],
        max_tokens: 16,
        temperature: 0,
        stream: false,
      }),
    });
    body = await readJsonResponse(response);
  } catch (error) {
    throw createConnectionError(error instanceof Error ? `无法连接测试接口：${error.message}` : "无法连接测试接口。", 502, {
      source: "POST /chat/completions",
    });
  }

  const durationMs = Date.now() - startedAt;
  if (!response.ok) {
    throw createConnectionError(`HTTP ${response.status}：${explainHttpStatus(response.status)}`, response.status, {
      source: "POST /chat/completions",
      httpStatus: response.status,
      durationMs,
      providerMessage: sanitizeProviderBody(body.text),
    });
  }

  const content = getChatContent(body.payload);
  if (!content) {
    throw createConnectionError("测试请求成功返回，但模型输出为空。", 502, {
      source: "POST /chat/completions",
      httpStatus: response.status,
      durationMs,
    });
  }

  const ok = content.includes("BIDFORGE_OK");
  if (!ok) {
    throw createConnectionError("测试请求返回内容不符合预期，请检查模型是否兼容 Chat Completions。", 502, {
      source: "POST /chat/completions",
      httpStatus: response.status,
      durationMs,
      outputPreview: content.slice(0, 100),
    });
  }

  const usage = body.payload?.usage
    ? {
        inputTokens: body.payload.usage.prompt_tokens ?? body.payload.usage.input_tokens ?? null,
        outputTokens: body.payload.usage.completion_tokens ?? body.payload.usage.output_tokens ?? null,
        totalTokens: body.payload.usage.total_tokens ?? null,
      }
    : {
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
      };

  return {
    status: "success",
    source: "POST /chat/completions",
    baseUrl: config.baseUrl,
    model: config.model,
    keyConfigured: true,
    durationMs,
    usage,
    outputPreview: "BIDFORGE_OK",
    message: "连接测试成功。",
  };
}

export function getCloudProviderStatus() {
  return {
    id: "cloud_api",
    name: "Cloud API Provider",
    status: "future",
    realAi: false,
    configured: false,
    available: false,
    message: "云端服务当前暂未开放。",
  };
}

export function setDefaultProviderPlaceholder(providerId) {
  return {
    defaultProvider,
    requestedProvider: providerId,
    saved: false,
    message: "本阶段仅展示默认 Provider 占位，不保存真实配置。",
    production: false,
    productionRc: false,
  };
}
