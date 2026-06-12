import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSupportedProviders } from "./providers/providerRegistry.js";
import { createMockRun } from "./services/mockRunner.js";
import {
  checkCodexProvider,
  fetchOpenAiCompatibleModels,
  getCloudProviderStatus,
  getOpenAiProviderStatus,
  getProviderConfigStatus,
  saveOpenAiProviderConfig,
  setDefaultProviderPlaceholder,
  testOpenAiCompatibleConnection,
} from "./services/providerConfig.js";
import { readRunDraftResult } from "./services/runResultReader.js";
import { getRunnerStatus } from "./services/runnerStatus.js";
import { loadLocalEnv } from "./utils/loadLocalEnv.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
await loadLocalEnv(projectRoot);

const envPort = typeof globalThis.process === "object" ? globalThis.process?.env?.BIDFORGE_RUNNER_PORT : undefined;
const port = Number(envPort ?? 8787);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function validateRunInput(input) {
  if (!input || typeof input !== "object") {
    return "请求体不能为空。";
  }

  const requiredFields = ["projectId", "sectionId", "sectionTitle", "mode", "skillProfile"];
  for (const field of requiredFields) {
    if (typeof input[field] !== "string" || input[field].trim() === "") {
      return `缺少必要字段：${field}`;
    }
  }

  if (input.provider !== undefined && typeof input.provider !== "string") {
    return "provider 必须是字符串。";
  }

  if (input.runMode !== undefined && !["mock_run", "dry_run", "api_run", "codex_workspace"].includes(input.runMode)) {
    return "runMode 必须是 mock_run / dry_run / api_run / codex_workspace。";
  }

  if (input.displayMode !== undefined && !["direct_forge", "agent_pack"].includes(input.displayMode)) {
    return "displayMode 必须是 direct_forge / agent_pack。";
  }

  if (!["compact_section", "subsection_batch"].includes(input.mode)) {
    return "当前 Runner 雏形仅支持 compact_section / subsection_batch 模式。";
  }

  if (input.skillProfile !== "current_candidate") {
    return "当前 Runner 雏形仅支持 current_candidate Skill Profile。";
  }

  return "";
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "bidforge-local-runner",
    providers: getSupportedProviders(),
    production: false,
    productionRc: false,
  });
});

app.get("/api/runner/status", async (_req, res) => {
  try {
    res.json(await getRunnerStatus({ port }));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      error: error instanceof Error ? error.message : "本地 Runner 状态读取失败。",
    });
  }
});

app.get("/api/runs/result", async (req, res) => {
  try {
    const runDir = typeof req.query.runDir === "string" ? req.query.runDir : "";
    res.json(await readRunDraftResult(runDir));
  } catch (error) {
    console.error(error);
    res.status(error.statusCode ?? 500).json({
      status: "failed",
      error: error instanceof Error ? error.message : "读取 Codex 结果失败。",
    });
  }
});

app.get("/api/providers/status", (_req, res) => {
  res.json(getProviderConfigStatus());
});

app.get("/api/providers/codex/check", async (_req, res) => {
  res.json(await checkCodexProvider());
});

app.get("/api/providers/openai/status", (_req, res) => {
  res.json(getOpenAiProviderStatus());
});

app.post("/api/providers/openai/config", async (req, res) => {
  try {
    res.json(await saveOpenAiProviderConfig(req.body));
  } catch (error) {
    res.status(error.statusCode ?? 500).json({
      status: "failed",
      error: error instanceof Error ? error.message : "OpenAI-Compatible API 配置保存失败。",
    });
  }
});

app.post("/api/providers/openai/models", async (req, res) => {
  try {
    res.json(await fetchOpenAiCompatibleModels(req.body));
  } catch (error) {
    res.status(error.statusCode ?? 500).json({
      status: "failed",
      error: error instanceof Error ? error.message : "模型列表获取失败。",
      detail: error.detail,
    });
  }
});

app.post("/api/providers/openai/test", async (req, res) => {
  try {
    res.json(await testOpenAiCompatibleConnection(req.body));
  } catch (error) {
    res.status(error.statusCode ?? 500).json({
      status: "failed",
      error: error instanceof Error ? error.message : "连接测试失败。",
      detail: error.detail,
    });
  }
});

app.get("/api/providers/cloud/status", (_req, res) => {
  res.json(getCloudProviderStatus());
});

app.post("/api/providers/default", (req, res) => {
  const providerId = typeof req.body?.providerId === "string" ? req.body.providerId : "";
  res.json(setDefaultProviderPlaceholder(providerId));
});

app.post("/api/runs", async (req, res) => {
  try {
    const validationError = validateRunInput(req.body);
    if (validationError) {
      res.status(400).json({ status: "failed", error: validationError });
      return;
    }

    const result = await createMockRun(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode ?? 500).json({
      status: "failed",
      provider: error.provider,
      runDir: error.runDir,
      files: error.files,
      error: error instanceof Error ? error.message : "本地 Runner 执行失败。",
    });
  }
});

app.listen(port, () => {
  console.log(`BIDFORGE local runner listening at http://localhost:${port}`);
});
