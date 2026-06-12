export const providerName = "OpenAI-Compatible API Provider";
export const modelName = "openai-compatible";

const defaultBaseUrl = "https://api.openai.com/v1";

function getApiKey() {
  return (
    process.env.BIDFORGE_API_KEY ||
    process.env.BIDFORGE_OPENAI_COMPATIBLE_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.BIDFORGE_OPENAI_API_KEY ||
    ""
  );
}

function normalizeBaseUrl(value) {
  return String(value || defaultBaseUrl).replace(/\/+$/, "");
}

function getRuntimeConfig(context) {
  const input = context?.input ?? {};

  return {
    baseUrl: normalizeBaseUrl(
      process.env.BIDFORGE_API_BASE_URL ||
        process.env.BIDFORGE_OPENAI_COMPATIBLE_BASE_URL ||
        input.baseUrl ||
        defaultBaseUrl,
    ),
    apiKey: getApiKey(),
    model:
      process.env.BIDFORGE_API_MODEL ||
      process.env.BIDFORGE_OPENAI_COMPATIBLE_MODEL ||
      input.model ||
      "gpt-4.1-mini",
    maxOutputTokens: Number(
      process.env.BIDFORGE_API_MAX_OUTPUT_TOKENS ||
        process.env.BIDFORGE_OPENAI_COMPATIBLE_MAX_OUTPUT_TOKENS ||
        input.maxOutputTokens ||
        1000,
    ),
    temperature: Number(
      process.env.BIDFORGE_API_TEMPERATURE ||
        process.env.BIDFORGE_OPENAI_COMPATIBLE_TEMPERATURE ||
        input.temperature ||
        0.4,
    ),
  };
}

function createProviderError(message, rawMeta = {}, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.provider = "openai_compatible";
  error.providerName = providerName;
  error.modelName = rawMeta.modelName ?? modelName;
  error.rawMeta = {
    realAi: false,
    provider: "openai_compatible",
    apiCalled: false,
    ...rawMeta,
  };
  return error;
}

function getResponseContent(payload) {
  const chatContent = payload?.choices?.[0]?.message?.content;
  if (typeof chatContent === "string") {
    return chatContent;
  }

  if (Array.isArray(chatContent)) {
    return chatContent
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  if (typeof payload?.output_text === "string") {
    return payload.output_text;
  }

  if (Array.isArray(payload?.output)) {
    return payload.output
      .flatMap((item) => item?.content ?? [])
      .map((part) => part?.text ?? "")
      .join("")
      .trim();
  }

  return "";
}

function sanitizeApiError(status, bodyText) {
  const body = String(bodyText ?? "").replace(/\s+/g, " ").slice(0, 500);
  return body ? `API 请求失败：HTTP ${status}。${body}` : `API 请求失败：HTTP ${status}。`;
}

export async function generateCompactSection(context) {
  const config = getRuntimeConfig(context);
  const promptMarkdown = String(context?.promptMarkdown ?? "").trim();

  if (!config.apiKey) {
    throw createProviderError(
      "API Key 未配置，无法执行 Direct Forge。",
      {
        modelName: config.model,
        baseUrlConfigured: Boolean(config.baseUrl),
        keyConfigured: false,
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
      },
      400,
    );
  }

  if (!config.baseUrl) {
    throw createProviderError(
      "Base URL 未配置，无法执行 Direct Forge。",
      {
        modelName: config.model,
        keyConfigured: true,
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
      },
      400,
    );
  }

  if (!config.model) {
    throw createProviderError(
      "Model 未配置，无法执行 Direct Forge。",
      {
        keyConfigured: true,
        baseUrlConfigured: Boolean(config.baseUrl),
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
      },
      400,
    );
  }

  if (!promptMarkdown) {
    throw createProviderError(
      "prompt.md 为空，无法执行 Direct Forge。",
      {
        modelName: config.model,
        keyConfigured: true,
        baseUrlConfigured: Boolean(config.baseUrl),
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
      },
      400,
    );
  }

  const endpoint = `${config.baseUrl}/chat/completions`;
  let response;
  let payload;
  let bodyText = "";

  try {
    response = await fetch(endpoint, {
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
            content:
              "你是 BIDFORGE 的标书章节生成执行器。只输出用户要求的 Markdown 正文，不解释过程，不输出 JSON。",
          },
          {
            role: "user",
            content: promptMarkdown,
          },
        ],
        temperature: config.temperature,
        max_tokens: config.maxOutputTokens,
        stream: false,
      }),
    });

    bodyText = await response.text();
    try {
      payload = bodyText ? JSON.parse(bodyText) : undefined;
    } catch {
      payload = undefined;
    }
  } catch (error) {
    throw createProviderError(
      error instanceof Error ? `API 请求失败：${error.message}` : "API 请求失败。",
      {
        realAi: true,
        apiCalled: true,
        modelName: config.model,
        keyConfigured: true,
        baseUrlConfigured: true,
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
      },
      502,
    );
  }

  if (!response.ok) {
    throw createProviderError(
      sanitizeApiError(response.status, bodyText),
      {
        realAi: true,
        apiCalled: true,
        statusCode: response.status,
        modelName: config.model,
        keyConfigured: true,
        baseUrlConfigured: true,
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
      },
      response.status,
    );
  }

  const markdown = getResponseContent(payload).trim();
  if (!markdown) {
    throw createProviderError(
      "API 返回为空，未生成正文。",
      {
        realAi: true,
        apiCalled: true,
        statusCode: response.status,
        modelName: config.model,
        keyConfigured: true,
        baseUrlConfigured: true,
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
      },
      502,
    );
  }

  const usage = payload?.usage
    ? {
        inputTokens: payload.usage.prompt_tokens ?? payload.usage.input_tokens ?? null,
        outputTokens: payload.usage.completion_tokens ?? payload.usage.output_tokens ?? null,
        totalTokens: payload.usage.total_tokens ?? null,
      }
    : {
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
      };

  return {
    markdown,
    providerName,
    modelName: config.model,
    usage,
    rawMeta: {
      realAi: true,
      provider: "openai_compatible",
      apiCalled: true,
      statusCode: response.status,
      modelName: config.model,
      keyConfigured: true,
      baseUrlConfigured: true,
      maxOutputTokens: config.maxOutputTokens,
      temperature: config.temperature,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      estimatedCost: null,
      finishReason: payload?.choices?.[0]?.finish_reason ?? "",
      responseId: payload?.id ?? "",
      stdoutLength: markdown.length,
      timedOut: false,
      exitCode: 0,
      stderrPreview: "",
    },
  };
}
