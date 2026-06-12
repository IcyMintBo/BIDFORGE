import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getProvider } from "../providers/providerRegistry.js";
import { safeFileName } from "../utils/safeFileName.js";
import { renderCodexWorkspaceInstructions } from "./codexWorkspaceInstructions.js";
import { renderGenerationTrace } from "./generationTrace.js";
import { buildPrompt } from "./promptBuilder.js";
import { loadSectionContext } from "./sectionContextLoader.js";
import {
  buildSingleSubsectionPrompt,
  buildSubsectionBatchPrompt,
} from "./subsectionPromptBuilder.js";
import {
  loadCurrentSkillManifest,
  renderUsedSkillManifest,
  summarizeSkillManifest,
} from "./skillLoader.js";
import { loadLocalEnv } from "../utils/loadLocalEnv.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const runsRoot = path.join(projectRoot, "runs");

const manifestSummary = {
  writingSkill: "bidforge-writing-candidate-v0.3",
  expansionSkill: "bidforge-expansion-candidate-v0.3",
  production: false,
  productionRc: false,
};

const baseStageBoundary = {
  name: "MVP 功能阶段",
  realAi: false,
  parseSourceFiles: false,
  production: false,
  productionRc: false,
  allowFormalProductionDraft: false,
};

const validRunModes = ["mock_run", "dry_run", "api_run", "codex_workspace"];
const validDisplayModes = ["direct_forge", "agent_pack"];
const taskPackPlaceholderMarker = "<!-- BIDFORGE_TASK_PACK_PLACEHOLDER -->";

function createTimestamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 17);
}

function createTaskId(timestamp, sectionId) {
  const random = Math.random().toString(36).slice(2, 8);
  return `run-${timestamp}-${safeFileName(sectionId, "section")}-${random}`;
}

function normalizeRunMode(input) {
  const value = String(input.runMode ?? "").trim();
  if (validRunModes.includes(value)) {
    return value;
  }

  if (input.provider === "local_codex") return "codex_workspace";
  if (input.provider === "local_openai" || input.provider === "openai_compatible") return "api_run";
  return "mock_run";
}

function normalizeDisplayMode(input, runMode) {
  const value = String(input.displayMode ?? "").trim();
  if (validDisplayModes.includes(value)) {
    return value;
  }

  if (runMode === "api_run") return "direct_forge";
  if (runMode === "codex_workspace" || runMode === "dry_run") return "agent_pack";
  return undefined;
}

function buildFileName(input, runMode) {
  return `${safeFileName(`${input.sectionId}-${input.sectionTitle}`, "section")}-${runMode}-${input.mode}-draft.md`;
}

function createStageBoundary(runMode) {
  return {
    ...baseStageBoundary,
    realAi: false,
  };
}

function tableValue(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replace(/\r?\n/g, "<br>");
}

function getRawMeta(providerResult, error) {
  return providerResult?.rawMeta ?? error?.rawMeta ?? {};
}

function getProviderDisplayName(providerKey) {
  if (providerKey === "mock") return "Mock Provider";
  if (providerKey === "dry_run") return "Dry Run / Task Pack";
  if (providerKey === "codex_workspace") return "Codex Workspace Mode";
  if (providerKey === "openai_compatible") return "OpenAI-Compatible API Provider";
  if (providerKey === "local_codex") return "Local Codex Provider";
  if (providerKey === "local_openai") return "Local OpenAI API Provider";
  if (providerKey === "cloud_api") return "Cloud API Provider";
  return providerKey;
}

function createPromptMetaSummary(promptMeta) {
  return {
    builder: promptMeta.builder,
    version: promptMeta.version,
    promptCharCount: promptMeta.promptCharCount,
    targetStructure: promptMeta.targetStructure,
    hasSectionOutline: promptMeta.hasSectionOutline,
    hasSourceMaterials: promptMeta.hasSourceMaterials,
    sourceMaterialsPath: promptMeta.sourceMaterialsPath,
    sourceMaterialsStatus: promptMeta.sourceMaterialsStatus,
    sourceMaterialsCharCount: promptMeta.sourceMaterialsCharCount,
    sourceMaterialFacts: promptMeta.sourceMaterialFacts,
    hasRuleSummaries: promptMeta.hasRuleSummaries,
    hasWordCountTarget: promptMeta.hasWordCountTarget,
    targetWordCountHint: promptMeta.targetWordCountHint,
    hasOutputStructureRequirements: promptMeta.hasOutputStructureRequirements,
    sectionOutlineItems: promptMeta.sectionOutlineItems,
    targetSubsections: promptMeta.targetSubsections,
    targetSubsectionIds: promptMeta.targetSubsectionIds,
    directoryFidelityRequired: promptMeta.directoryFidelityRequired,
    subsectionBatch: Boolean(promptMeta.subsectionBatch),
    subsectionLimit: promptMeta.subsectionLimit ?? null,
    injectedRules: promptMeta.injectedRules.map((rule) => ({
      skill: rule.skill,
      id: rule.id,
      title: rule.title,
      injection: rule.injection,
    })),
    injectedMaterials: promptMeta.injectedMaterials.map((material) => ({
      id: material.id,
      label: material.label,
      injected: material.injected,
      reason: material.reason,
      path: material.path,
      charCount: material.charCount,
      itemCount: material.itemCount,
    })),
  };
}

function buildTaskPayload({
  taskBase,
  providerResult,
  error,
  promptSummary,
  promptMeta,
  skillManifestSummary,
  subsectionSummary,
  runMode,
  apiConfig,
}) {
  const rawMeta = getRawMeta(providerResult, error);
  const providerName = providerResult?.providerName ?? taskBase.providerName;
  const modelName = providerResult?.modelName ?? taskBase.modelName;

  return {
    ...taskBase,
    status: error ? "failed" : "success",
    providerName,
    modelName,
    model: modelName,
    usage: providerResult?.usage,
    providerRawMeta: rawMeta,
    providerExitCode: rawMeta.exitCode ?? null,
    providerStdoutLength: rawMeta.stdoutLength ?? null,
    providerStderrPreview: rawMeta.stderrPreview ?? "",
    providerTimedOut: Boolean(rawMeta.timedOut),
    runMode,
    displayMode: taskBase.displayMode ?? null,
    isRealAI: Boolean(rawMeta.realAi),
    isApiRun: runMode === "api_run",
    isDryRun: runMode === "dry_run",
    isMockRun: runMode === "mock_run",
    isCodexWorkspace: runMode === "codex_workspace",
    isTaskPack: taskBase.displayMode === "agent_pack" || runMode === "dry_run" || runMode === "codex_workspace",
    maxOutputTokens: apiConfig?.maxOutputTokens ?? rawMeta.maxOutputTokens ?? null,
    temperature: apiConfig?.temperature ?? rawMeta.temperature ?? null,
    inputTokens: providerResult?.usage?.inputTokens ?? null,
    outputTokens: providerResult?.usage?.outputTokens ?? null,
    totalTokens: providerResult?.usage?.totalTokens ?? null,
    estimatedCost: rawMeta.estimatedCost ?? null,
    apiCalled: Boolean(rawMeta.apiCalled),
    promptSummary,
    promptMeta: createPromptMetaSummary(promptMeta),
    subsectionSummary,
    manifestSummary,
    skillManifest: {
      writingSkill: skillManifestSummary.writingSkill,
      expansionSkill: skillManifestSummary.expansionSkill,
      production: false,
      productionRc: false,
      loadedAt: skillManifestSummary.loadedAt,
      docs: skillManifestSummary.docs,
    },
    error: error ? error.message : undefined,
  };
}

function buildFailedDraft(error) {
  return `# Local Provider 生成失败

本次未写入 Provider 输出正文。

请查看 auditor_result.md 与 generation_trace.md，并检查当前 Provider 是否可用。

错误信息：${error.message}
`;
}

function createApiConfig(input) {
  const maxOutputTokens = Number(input.maxOutputTokens ?? 1000);
  const temperature = Number(input.temperature ?? 0.4);

  return {
    baseUrl: String(
      process.env.BIDFORGE_API_BASE_URL ??
        process.env.BIDFORGE_OPENAI_COMPATIBLE_BASE_URL ??
        input.baseUrl ??
        "https://api.openai.com/v1",
    ),
    apiKeyConfigured: Boolean(
      process.env.BIDFORGE_API_KEY ||
        process.env.BIDFORGE_OPENAI_COMPATIBLE_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.BIDFORGE_OPENAI_API_KEY,
    ),
    model: String(process.env.BIDFORGE_API_MODEL ?? process.env.BIDFORGE_OPENAI_COMPATIBLE_MODEL ?? input.model ?? "gpt-4.1-mini"),
    maxOutputTokens: Number.isFinite(Number(process.env.BIDFORGE_API_MAX_OUTPUT_TOKENS))
      ? Number(process.env.BIDFORGE_API_MAX_OUTPUT_TOKENS)
      : Number.isFinite(maxOutputTokens)
        ? maxOutputTokens
        : 1000,
    temperature: Number.isFinite(Number(process.env.BIDFORGE_API_TEMPERATURE))
      ? Number(process.env.BIDFORGE_API_TEMPERATURE)
      : Number.isFinite(temperature)
        ? temperature
        : 0.4,
  };
}

function createNonCallingProviderResult({ runMode, displayMode, providerInfo, apiConfig }) {
  return {
    providerName: providerInfo.providerName,
    modelName: providerInfo.modelName,
    usage: {
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
    },
    rawMeta: {
      realAi: false,
      provider: providerInfo.key,
      runMode,
      displayMode: displayMode ?? null,
      isApiRun: runMode === "api_run",
      isDryRun: runMode === "dry_run",
      isMockRun: runMode === "mock_run",
      isCodexWorkspace: runMode === "codex_workspace",
      isTaskPack: displayMode === "agent_pack" || runMode === "dry_run" || runMode === "codex_workspace",
      apiCalled: false,
      maxOutputTokens: apiConfig?.maxOutputTokens ?? null,
      temperature: apiConfig?.temperature ?? null,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      estimatedCost: null,
      stdoutLength: 0,
      timedOut: false,
      exitCode: null,
      stderrPreview: "",
    },
  };
}

function buildTaskPackDraft({ input, runMode, files, apiConfig }) {
  if (runMode === "api_run") {
    return `${taskPackPlaceholderMarker}

# API Run 准备完成

本次已生成 BIDFORGE API 真实生成所需任务上下文，但当前阶段未调用真实 API。

请确认 API 配置与 prompt.md 后，再进入下一阶段最小 API 调用。

## API 配置摘要

* Base URL：${apiConfig.baseUrl}
* API Key：${apiConfig.apiKeyConfigured ? "已配置（未写入 run 文件）" : "未配置"}
* Model：${apiConfig.model}
* max_output_tokens：${apiConfig.maxOutputTokens}
* temperature：${apiConfig.temperature}

## 已生成文件

* ${files.prompt}
* ${files.generationTrace}
* ${files.manifest}
* ${files.codexInstructions}

本次未进入 Production，未进入 Production RC。
`;
  }

  if (runMode === "codex_workspace") {
    return `${taskPackPlaceholderMarker}

# Codex Workspace 任务包已生成

本次未自动调用 Codex，也未调用任何 API。

请复制 Codex 指令，在真实 Codex 终端 / Codex 交互环境中读取 codex_instructions.md 并完成本次 run。

完成后请将正文写入 draft.md，再回到 BIDFORGE 点击“读取 Codex 结果”。

## 已生成文件

* ${files.prompt}
* ${files.generationTrace}
* ${files.manifest}
* ${files.codexInstructions}

本次未进入 Production，未进入 Production RC。
`;
  }

  return `${taskPackPlaceholderMarker}

# Dry Run / 任务包已生成

本次未调用任何真实 Provider，不消耗 API。

本次只生成任务上下文、prompt、trace、manifest、auditor 与 Codex Workspace 指令，用于检查上下文是否完整。

## 已生成文件

* ${files.prompt}
* ${files.generationTrace}
* ${files.manifest}
* ${files.codexInstructions}

本次未进入 Production，未进入 Production RC。
`;
}

function createTaskPackPreviewMarkdown(draftMarkdown) {
  return draftMarkdown.replace(taskPackPlaceholderMarker, "").trim();
}

function renderSubsectionRows(subsectionSummary) {
  if (!subsectionSummary) {
    return "";
  }

  return subsectionSummary.items
    .map((item) => {
      return `| ${tableValue(item.id)} | ${tableValue(item.title)} | ${tableValue(item.status)} | ${item.timedOut ? "是" : "否"} | ${tableValue(item.outputCharCount)} | ${tableValue(item.error ?? "")} |`;
    })
    .join("\n");
}

function buildAuditorResult({ providerKey, providerResult, error, status, subsectionSummary, runMode, displayMode, apiConfig }) {
  const rawMeta = getRawMeta(providerResult, error);
  const success = status === "success";
  const providerName = providerResult?.providerName ?? error?.providerName ?? getProviderDisplayName(providerKey);
  const modelName = providerResult?.modelName ?? error?.modelName ?? rawMeta.codexVersion ?? "unknown";
  const currentDisplayMode = displayMode ?? rawMeta.displayMode ?? (runMode === "api_run" ? "direct_forge" : runMode === "codex_workspace" || runMode === "dry_run" ? "agent_pack" : "");
  const displayModeLabel =
    currentDisplayMode === "direct_forge" ? "Direct Forge" : currentDisplayMode === "agent_pack" ? "Agent Pack" : "未记录";

  const subsectionBlock = subsectionSummary
    ? `
## Subsection Batch

| 检查项 | 结果 |
| ---- | ---- |
| 是否启用 subsection_batch | 是 |
| 目标小节数量 | ${subsectionSummary.targetCount} |
| 本次执行小节数量 | ${subsectionSummary.attemptedCount} |
| 成功数量 | ${subsectionSummary.successCount} |
| 失败数量 | ${subsectionSummary.failedCount} |
| 是否生成 subsection_drafts | ${subsectionSummary.subsectionDraftsWritten ? "是" : "否"} |
| 是否生成 subsection_prompts | ${subsectionSummary.subsectionPromptsWritten ? "是" : "否"} |
| 是否合并 draft.md | ${subsectionSummary.draftMerged ? "是" : "否"} |
| 是否 fallback 到 Mock | 否 |

| 小节 | 标题 | 状态 | 是否超时 | 输出字符数 | 错误 |
| ---- | ---- | ---- | ---- | ---- | ---- |
${renderSubsectionRows(subsectionSummary)}
`
    : "";

  return `# BIDFORGE Runner Auditor 记录

| 检查项 | 结果 |
| ---- | ---- |
| 是否创建 run 目录 | 是 |
| 是否写入 task.json | 是 |
| 是否生成 used_skill_manifest.md | 是 |
| 是否使用 promptBuilder | 是 |
| 是否生成 codex_instructions.md | 是 |
| prompt.md 是否由 task + provider + skill manifest 生成 | 是 |
| 是否写入 prompt.md | 是 |
| 是否写入 generation_trace.md | 是 |
| 是否写入 draft.md | 是 |
| 是否写入 auditor_result.md | 是 |
| 是否读取当前 Candidate Skill | 是 |
| 是否读取状态文档 | 是 |
| 当前 Provider | ${tableValue(providerKey)} |
| 前台模式 | ${tableValue(displayModeLabel)} |
| displayMode | ${tableValue(currentDisplayMode)} |
| runMode | ${tableValue(runMode ?? "")} |
| Provider 名称 | ${tableValue(providerName)} |
| Model 名称 | ${tableValue(modelName)} |
| Provider 执行状态 | ${success ? "成功" : "失败"} |
| 是否接真实 AI | ${rawMeta.realAi ? "是" : "否"} |
| 是否 API Run | ${runMode === "api_run" ? "是" : "否"} |
| 是否 Dry Run | ${runMode === "dry_run" ? "是" : "否"} |
| 是否 Mock Run | ${runMode === "mock_run" ? "是" : "否"} |
| 是否 Codex Workspace | ${runMode === "codex_workspace" ? "是" : "否"} |
| 是否 Task Pack | ${currentDisplayMode === "agent_pack" || runMode === "dry_run" || runMode === "codex_workspace" ? "是" : "否"} |
| 是否调用真实 API | ${rawMeta.apiCalled ? "是" : "否"} |
| max_output_tokens | ${tableValue(apiConfig?.maxOutputTokens ?? rawMeta.maxOutputTokens ?? "")} |
| temperature | ${tableValue(apiConfig?.temperature ?? rawMeta.temperature ?? "")} |
| inputTokens | ${tableValue(rawMeta.inputTokens ?? "")} |
| outputTokens | ${tableValue(rawMeta.outputTokens ?? "")} |
| totalTokens | ${tableValue(rawMeta.totalTokens ?? "")} |
| estimatedCost | ${tableValue(rawMeta.estimatedCost ?? "")} |
| Codex 是否接入 | ${providerKey === "local_codex" ? "是" : "否"} |
| OpenAI-Compatible API 是否接入 | ${providerKey === "openai_compatible" ? "是" : "否"} |
| 是否解析 PDF/DOCX | 否 |
| 是否进入 Production | 否 |
| 是否进入 Production RC | 否 |
| exitCode | ${tableValue(rawMeta.exitCode ?? "")} |
| timedOut | ${rawMeta.timedOut ? "是" : "否"} |
| stdoutLength | ${tableValue(rawMeta.stdoutLength ?? "")} |
| stderrPreview | ${tableValue(rawMeta.stderrPreview ?? "")} |
${error ? `| 错误信息 | ${tableValue(error.message)} |\n` : ""}
${subsectionBlock}
本次 run 用于验证 Provider Adapter、Skill Loader、promptBuilder、Generation Trace、小节级生成、本地 Runner 文件落盘和前后端通信，不代表进入 Production 或 Production RC。`;
}

async function writeRunFiles({
  runDirAbs,
  task,
  input,
  providerKey,
  skillManifest,
  providerExecution,
  generationTrace,
  draftMarkdown,
  auditorMarkdown,
  runDir,
  files,
  subsectionSummary,
}) {
  await Promise.all([
    writeFile(path.join(runDirAbs, "task.json"), `${JSON.stringify(task, null, 2)}\n`, "utf8"),
    writeFile(
      path.join(runDirAbs, "used_skill_manifest.md"),
      `${renderUsedSkillManifest({
        input,
        providerKey,
        taskId: task.taskId,
        skillManifest,
        providerExecution,
      })}\n`,
      "utf8",
    ),
    writeFile(path.join(runDirAbs, "generation_trace.md"), `${generationTrace}\n`, "utf8"),
    writeFile(
      path.join(runDirAbs, "codex_instructions.md"),
      `${renderCodexWorkspaceInstructions({
        input,
        task,
        runDir,
        runDirAbs,
        files,
        subsectionSummary,
      })}\n`,
      "utf8",
    ),
    writeFile(path.join(runDirAbs, "draft.md"), `${draftMarkdown}\n`, "utf8"),
    writeFile(path.join(runDirAbs, "auditor_result.md"), `${auditorMarkdown}\n`, "utf8"),
  ]);
}

function resolveSubsectionLimit(input, totalCount) {
  const fromInput = Number(input.subsectionLimit);
  if (Number.isFinite(fromInput) && fromInput > 0) {
    return Math.min(Math.floor(fromInput), totalCount);
  }

  const fromEnv = Number(globalThis.process?.env?.BIDFORGE_SUBSECTION_LIMIT);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.min(Math.floor(fromEnv), totalCount);
  }

  return totalCount;
}

function createSubsectionFailureMarkdown(subsection, error) {
  return `## ${subsection.id} ${subsection.title}

> 本小节生成失败：${error.message}
`;
}

function createSubsectionSummary({ outlineItems, attemptedItems, results, providerKey }) {
  const successCount = results.filter((item) => item.status === "success").length;
  const failedCount = results.filter((item) => item.status === "failed").length;

  return {
    enabled: true,
    provider: providerKey,
    targetCount: outlineItems.length,
    attemptedCount: attemptedItems.length,
    successCount,
    failedCount,
    subsectionDraftsWritten: true,
    subsectionPromptsWritten: true,
    draftMerged: true,
    fallbackToMock: false,
    items: results,
  };
}

function createAggregateProviderResult({ providerInfo, providerKey, subsectionSummary, results }) {
  const rawItems = results.map((item) => item.rawMeta).filter(Boolean);
  const timedOut = rawItems.some((item) => item.timedOut);
  const stdoutLength = rawItems.reduce((sum, item) => sum + Number(item.stdoutLength ?? 0), 0);

  return {
    providerName: providerInfo.providerName,
    modelName: results.find((item) => item.modelName)?.modelName ?? providerInfo.modelName,
    usage: undefined,
    rawMeta: {
      realAi: providerKey === "local_codex",
      provider: providerKey,
      subsectionBatch: true,
      targetCount: subsectionSummary.targetCount,
      attemptedCount: subsectionSummary.attemptedCount,
      successCount: subsectionSummary.successCount,
      failedCount: subsectionSummary.failedCount,
      timedOut,
      stdoutLength,
    },
  };
}

function getDirectForgeTargetSubsection(sectionContext, input) {
  const outlineItems = sectionContext?.sectionOutline?.items ?? [];
  return (
    outlineItems.find((item) => item.id === "5.1.1") ??
    outlineItems[0] ?? {
      id: input.sectionId,
      title: input.sectionTitle,
    }
  );
}

function buildDirectForgePrompt({ input, providerInfo, sectionContext, taskBase, targetSubsection }) {
  const batchPrompt = buildSubsectionBatchPrompt({
    input: {
      ...input,
      mode: "subsection_batch",
    },
    provider: providerInfo,
    sectionContext,
    task: taskBase,
    subsectionLimit: 1,
  });
  const promptMarkdown = buildSingleSubsectionPrompt({
    input,
    provider: providerInfo,
    sectionContext,
    subsection: targetSubsection,
    task: taskBase,
  });
  const promptMeta = {
    ...batchPrompt.promptMeta,
    promptCharCount: promptMarkdown.length,
    targetStructure: "api_single_subsection",
    targetSubsections: [`${targetSubsection.id} ${targetSubsection.title}`],
    targetSubsectionIds: [targetSubsection.id],
    targetWordCountHint: "Direct Forge 单小节：100–200 字左右。",
    subsectionBatch: false,
    subsectionLimit: 1,
    apiSingleSubsection: true,
    requiresFullSectionCoverage: false,
  };

  return {
    promptMarkdown,
    promptSummary: {
      ...batchPrompt.promptSummary,
      mode: "api_single_subsection",
      provider: providerInfo.key,
      providerName: providerInfo.providerName,
      structures: [
        "Current Chapter",
        "Current Subsection",
        "Full Section Outline",
        "Source Materials Summary",
        "Candidate Skill Rule Summary",
        "Output Instruction",
      ],
      promptCharCount: promptMeta.promptCharCount,
      targetWordCountHint: promptMeta.targetWordCountHint,
      subsectionBatch: false,
      apiSingleSubsection: true,
      targetSubsection: `${targetSubsection.id} ${targetSubsection.title}`,
    },
    promptMeta,
  };
}

async function createSubsectionBatchRun({
  input,
  providerLookup,
  providerKey,
  providerInfo,
  taskBase,
  runDir,
  runDirAbs,
  files,
  skillManifest,
  skillManifestSummary,
  sectionContext,
  stageBoundary,
  fileName,
  runMode,
  apiConfig,
}) {
  const outlineItems = sectionContext.sectionOutline.items;
  const limit = resolveSubsectionLimit(input, outlineItems.length);
  const attemptedItems = outlineItems.slice(0, limit);
  const { promptMarkdown, promptSummary, promptMeta } = buildSubsectionBatchPrompt({
    input,
    provider: providerInfo,
    sectionContext,
    task: taskBase,
    subsectionLimit: limit === outlineItems.length ? undefined : limit,
  });

  await mkdir(path.join(runDirAbs, "subsection_drafts"), { recursive: true });
  await mkdir(path.join(runDirAbs, "subsection_prompts"), { recursive: true });
  await writeFile(path.join(runDirAbs, "prompt.md"), `${promptMarkdown}\n`, "utf8");

  const results = [];
  const mergedParts = [`# ${input.sectionId} ${input.sectionTitle}`];

  for (const subsection of attemptedItems) {
    const safeId = safeFileName(subsection.id, "subsection");
    const promptFileName = `${safeId}.prompt.md`;
    const draftFileName = `${safeId}.md`;
    const subsectionPrompt = buildSingleSubsectionPrompt({
      input,
      provider: providerInfo,
      sectionContext,
      subsection,
      task: taskBase,
    });

    await writeFile(path.join(runDirAbs, "subsection_prompts", promptFileName), `${subsectionPrompt}\n`, "utf8");

    try {
      const providerResult = await providerLookup.provider.generateCompactSection({
        input,
        task: taskBase,
        taskId: taskBase.taskId,
        createdAt: taskBase.createdAt,
        manifestSummary,
        skillManifest: skillManifestSummary,
        provider: providerInfo,
        promptMarkdown: subsectionPrompt,
        promptSummary,
        promptMeta,
        sectionContext,
        subsection,
        stage: stageBoundary,
        projectRoot,
        runDir,
        runDirAbs,
        files,
      });
      const markdown = providerResult.markdown.trim();

      await writeFile(path.join(runDirAbs, "subsection_drafts", draftFileName), `${markdown}\n`, "utf8");
      mergedParts.push(markdown);
      results.push({
        id: subsection.id,
        title: subsection.title,
        provider: providerKey,
        status: "success",
        timedOut: Boolean(providerResult.rawMeta?.timedOut),
        outputCharCount: markdown.length,
        fileName: `subsection_drafts/${draftFileName}`,
        promptFileName: `subsection_prompts/${promptFileName}`,
        modelName: providerResult.modelName,
        rawMeta: providerResult.rawMeta,
      });
    } catch (error) {
      const failedMarkdown = createSubsectionFailureMarkdown(subsection, error);
      const rawMeta = error?.rawMeta ?? {};

      await writeFile(path.join(runDirAbs, "subsection_drafts", draftFileName), `${failedMarkdown}\n`, "utf8");
      mergedParts.push(failedMarkdown);
      results.push({
        id: subsection.id,
        title: subsection.title,
        provider: providerKey,
        status: "failed",
        timedOut: Boolean(rawMeta.timedOut),
        outputCharCount: failedMarkdown.length,
        fileName: `subsection_drafts/${draftFileName}`,
        promptFileName: `subsection_prompts/${promptFileName}`,
        error: error instanceof Error ? error.message : "小节生成失败",
        rawMeta,
      });
    }
  }

  const draftMarkdown = `${mergedParts.join("\n\n").trim()}\n`;
  const subsectionSummary = createSubsectionSummary({
    outlineItems,
    attemptedItems,
    results,
    providerKey,
  });
  const aggregateProviderResult = createAggregateProviderResult({
    providerInfo,
    providerKey,
    subsectionSummary,
    results,
  });
  const task = buildTaskPayload({
    taskBase,
    providerResult: aggregateProviderResult,
    promptSummary,
    promptMeta,
    skillManifestSummary,
    subsectionSummary,
    runMode,
    apiConfig,
  });
  const generationTrace = renderGenerationTrace({
    input,
    task,
    providerKey,
    providerResult: aggregateProviderResult,
    promptMeta,
    promptSummary,
    skillManifest,
    skillManifestSummary,
    promptMarkdown,
    draftMarkdown,
    subsectionSummary,
  });

  await writeRunFiles({
    runDirAbs,
    task,
    input,
    providerKey,
    skillManifest,
    providerExecution: {
      status: subsectionSummary.failedCount > 0 ? "partial" : "success",
      providerName: task.providerName,
      realAi: Boolean(task.providerRawMeta?.realAi),
    },
    generationTrace,
    draftMarkdown,
    auditorMarkdown: buildAuditorResult({
      providerKey,
      providerResult: aggregateProviderResult,
      status: "success",
      subsectionSummary,
      runMode,
      displayMode: taskBase.displayMode,
      apiConfig,
    }),
    runDir,
    files,
    subsectionSummary,
  });

  return {
    taskId: taskBase.taskId,
    status: "success",
    markdown: createTaskPackPreviewMarkdown(draftMarkdown),
    fileName,
    createdAt: taskBase.createdAt,
    runDir,
    absoluteRunDir: runDirAbs,
    files,
    provider: providerKey,
    runMode,
    displayMode: taskBase.displayMode,
    providerName: aggregateProviderResult.providerName,
    modelName: aggregateProviderResult.modelName,
    usage: aggregateProviderResult.usage,
    manifestSummary,
    skillManifest: {
      writingSkill: skillManifestSummary.writingSkill,
      expansionSkill: skillManifestSummary.expansionSkill,
      production: false,
      productionRc: false,
      loadedAt: skillManifestSummary.loadedAt,
    },
    subsectionSummary,
  };
}

async function createApiSingleSubsectionRun({
  input,
  providerLookup,
  providerKey,
  providerInfo,
  taskBase,
  runDir,
  runDirAbs,
  files,
  skillManifest,
  skillManifestSummary,
  sectionContext,
  stageBoundary,
  fileName,
  runMode,
  apiConfig,
}) {
  const targetSubsection = getDirectForgeTargetSubsection(sectionContext, input);
  const { promptMarkdown, promptSummary, promptMeta } = buildDirectForgePrompt({
    input,
    providerInfo,
    sectionContext,
    taskBase,
    targetSubsection,
  });

  await writeFile(path.join(runDirAbs, "prompt.md"), `${promptMarkdown}\n`, "utf8");

  const providerContext = {
    input,
    task: taskBase,
    taskId: taskBase.taskId,
    createdAt: taskBase.createdAt,
    manifestSummary,
    skillManifest: skillManifestSummary,
    provider: providerInfo,
    promptMarkdown,
    promptSummary,
    promptMeta,
    sectionContext,
    subsection: targetSubsection,
    stage: stageBoundary,
    projectRoot,
    runDir,
    runDirAbs,
    files,
  };

  let providerResult;
  let markdown;

  try {
    providerResult = await providerLookup.provider.generateCompactSection(providerContext);
    markdown = providerResult.markdown.trim();
  } catch (error) {
    const task = buildTaskPayload({
      taskBase,
      error,
      promptSummary,
      promptMeta,
      skillManifestSummary,
      runMode,
      apiConfig,
    });
    const failedDraft = buildFailedDraft(error);
    const generationTrace = renderGenerationTrace({
      input,
      task,
      providerKey,
      error,
      promptMeta,
      promptSummary,
      skillManifest,
      skillManifestSummary,
      promptMarkdown,
      draftMarkdown: failedDraft,
    });

    await writeRunFiles({
      runDirAbs,
      task,
      input,
      providerKey,
      skillManifest,
      providerExecution: {
        status: "failed",
        providerName: task.providerName,
        realAi: Boolean(task.providerRawMeta?.realAi),
      },
      generationTrace,
      draftMarkdown: failedDraft,
      auditorMarkdown: buildAuditorResult({
        providerKey,
        error,
        status: "failed",
        runMode,
        displayMode: taskBase.displayMode,
        apiConfig,
      }),
      runDir,
      files,
    });

    error.runDir = runDir;
    error.files = files;
    throw error;
  }

  const task = buildTaskPayload({
    taskBase,
    providerResult,
    promptSummary,
    promptMeta,
    skillManifestSummary,
    runMode,
    apiConfig,
  });
  const generationTrace = renderGenerationTrace({
    input,
    task,
    providerKey,
    providerResult,
    promptMeta,
    promptSummary,
    skillManifest,
    skillManifestSummary,
    promptMarkdown,
    draftMarkdown: markdown,
  });

  await writeRunFiles({
    runDirAbs,
    task,
    input,
    providerKey,
    skillManifest,
    providerExecution: {
      status: "success",
      providerName: task.providerName,
      realAi: Boolean(task.providerRawMeta?.realAi),
    },
    generationTrace,
    draftMarkdown: markdown,
    auditorMarkdown: buildAuditorResult({
      providerKey,
      providerResult,
      status: "success",
      runMode,
      displayMode: taskBase.displayMode,
      apiConfig,
    }),
    runDir,
    files,
  });

  return {
    taskId: taskBase.taskId,
    status: "success",
    markdown,
    fileName,
    createdAt: taskBase.createdAt,
    runDir,
    absoluteRunDir: runDirAbs,
    files,
    provider: providerKey,
    runMode,
    displayMode: taskBase.displayMode,
    providerName: providerResult.providerName,
    modelName: providerResult.modelName,
    usage: providerResult.usage,
    isRealAI: true,
    isApiRun: true,
    apiCalled: true,
    maxOutputTokens: apiConfig.maxOutputTokens,
    temperature: apiConfig.temperature,
    inputTokens: providerResult.usage?.inputTokens ?? null,
    outputTokens: providerResult.usage?.outputTokens ?? null,
    totalTokens: providerResult.usage?.totalTokens ?? null,
    estimatedCost: providerResult.rawMeta?.estimatedCost ?? null,
    manifestSummary,
    skillManifest: {
      writingSkill: skillManifestSummary.writingSkill,
      expansionSkill: skillManifestSummary.expansionSkill,
      production: false,
      productionRc: false,
      loadedAt: skillManifestSummary.loadedAt,
    },
  };
}

async function createTaskPackRun({
  input,
  providerKey,
  providerInfo,
  taskBase,
  runDir,
  runDirAbs,
  files,
  skillManifest,
  skillManifestSummary,
  sectionContext,
  stageBoundary,
  fileName,
  runMode,
  apiConfig,
}) {
  const isSubsectionBatch = input.mode === "subsection_batch";
  let promptMarkdown;
  let promptSummary;
  let promptMeta;
  let subsectionSummary;

  if (isSubsectionBatch) {
    const outlineItems = sectionContext.sectionOutline.items;
    const limit = resolveSubsectionLimit(input, outlineItems.length);
    const attemptedItems = outlineItems.slice(0, limit);
    const built = buildSubsectionBatchPrompt({
      input,
      provider: providerInfo,
      sectionContext,
      task: taskBase,
      subsectionLimit: limit === outlineItems.length ? undefined : limit,
    });

    promptMarkdown = built.promptMarkdown;
    promptSummary = built.promptSummary;
    promptMeta = built.promptMeta;

    await mkdir(path.join(runDirAbs, "subsection_prompts"), { recursive: true });
    await mkdir(path.join(runDirAbs, "subsection_drafts"), { recursive: true });

    for (const subsection of attemptedItems) {
      const safeId = safeFileName(subsection.id, "subsection");
      const subsectionPrompt = buildSingleSubsectionPrompt({
        input,
        provider: providerInfo,
        sectionContext,
        subsection,
        task: taskBase,
      });

      await writeFile(path.join(runDirAbs, "subsection_prompts", `${safeId}.prompt.md`), `${subsectionPrompt}\n`, "utf8");
    }

    subsectionSummary = {
      enabled: true,
      provider: providerKey,
      targetCount: outlineItems.length,
      attemptedCount: attemptedItems.length,
      successCount: 0,
      failedCount: 0,
      subsectionDraftsWritten: false,
      subsectionPromptsWritten: true,
      draftMerged: false,
      fallbackToMock: false,
      items: attemptedItems.map((item) => ({
        id: item.id,
        title: item.title,
        provider: providerKey,
        status: "pending",
        timedOut: false,
        outputCharCount: 0,
        fileName: `subsection_drafts/${safeFileName(item.id, "subsection")}.md`,
        promptFileName: `subsection_prompts/${safeFileName(item.id, "subsection")}.prompt.md`,
      })),
    };
  } else {
    const built = buildPrompt({
      task: taskBase,
      provider: providerInfo,
      skillManifest: skillManifestSummary,
      mode: input.mode,
      section: {
        id: input.sectionId,
        title: input.sectionTitle,
      },
      stage: stageBoundary,
      sectionContext,
    });

    promptMarkdown = built.promptMarkdown;
    promptSummary = built.promptSummary;
    promptMeta = built.promptMeta;
  }

  await writeFile(path.join(runDirAbs, "prompt.md"), `${promptMarkdown}\n`, "utf8");

  const providerResult = createNonCallingProviderResult({ runMode, displayMode: taskBase.displayMode, providerInfo, apiConfig });
  const draftMarkdown = buildTaskPackDraft({ input, runMode, files, apiConfig });
  const task = buildTaskPayload({
    taskBase,
    providerResult,
    promptSummary,
    promptMeta,
    skillManifestSummary,
    subsectionSummary,
    runMode,
    apiConfig,
  });
  const generationTrace = renderGenerationTrace({
    input,
    task,
    providerKey,
    providerResult,
    promptMeta,
    promptSummary,
    skillManifest,
    skillManifestSummary,
    promptMarkdown,
    draftMarkdown,
    subsectionSummary,
  });

  await writeRunFiles({
    runDirAbs,
    task,
    input,
    providerKey,
    skillManifest,
    providerExecution: {
      status: "prepared",
      providerName: task.providerName,
      realAi: false,
    },
    generationTrace,
    draftMarkdown,
    auditorMarkdown: buildAuditorResult({
      providerKey,
      providerResult,
      status: "success",
      subsectionSummary,
      runMode,
      displayMode: taskBase.displayMode,
      apiConfig,
    }),
    runDir,
    files,
    subsectionSummary,
  });

  return {
    taskId: taskBase.taskId,
    status: "success",
    markdown: draftMarkdown.trim(),
    fileName,
    createdAt: taskBase.createdAt,
    runDir,
    absoluteRunDir: runDirAbs,
    files,
    provider: providerKey,
    runMode,
    displayMode: taskBase.displayMode,
    providerName: providerResult.providerName,
    modelName: providerResult.modelName,
    usage: providerResult.usage,
    manifestSummary,
    skillManifest: {
      writingSkill: skillManifestSummary.writingSkill,
      expansionSkill: skillManifestSummary.expansionSkill,
      production: false,
      productionRc: false,
      loadedAt: skillManifestSummary.loadedAt,
    },
    subsectionSummary,
    apiCalled: false,
  };
}

async function createCompactRun({
  input,
  providerLookup,
  providerKey,
  providerInfo,
  taskBase,
  runDir,
  runDirAbs,
  files,
  skillManifest,
  skillManifestSummary,
  sectionContext,
  stageBoundary,
  fileName,
  runMode,
  apiConfig,
}) {
  const { promptMarkdown, promptSummary, promptMeta } = buildPrompt({
    task: taskBase,
    provider: providerInfo,
    skillManifest: skillManifestSummary,
    mode: input.mode,
    section: {
      id: input.sectionId,
      title: input.sectionTitle,
    },
    stage: stageBoundary,
    sectionContext,
  });

  await writeFile(path.join(runDirAbs, "prompt.md"), `${promptMarkdown}\n`, "utf8");

  const providerContext = {
    input,
    task: taskBase,
    taskId: taskBase.taskId,
    createdAt: taskBase.createdAt,
    manifestSummary,
    skillManifest: skillManifestSummary,
    provider: providerInfo,
    promptMarkdown,
    promptSummary,
    promptMeta,
    sectionContext,
    stage: stageBoundary,
    projectRoot,
    runDir,
    runDirAbs,
    files,
  };

  let providerResult;
  let markdown;

  try {
    providerResult = await providerLookup.provider.generateCompactSection(providerContext);
    markdown = providerResult.markdown.trim();
  } catch (error) {
    const task = buildTaskPayload({
      taskBase,
      error,
      promptSummary,
      promptMeta,
      skillManifestSummary,
      runMode,
      apiConfig,
    });
    const failedDraft = buildFailedDraft(error);
    const generationTrace = renderGenerationTrace({
      input,
      task,
      providerKey,
      error,
      promptMeta,
      promptSummary,
      skillManifest,
      skillManifestSummary,
      promptMarkdown,
      draftMarkdown: failedDraft,
    });

    await writeRunFiles({
      runDirAbs,
      task,
      input,
      providerKey,
      skillManifest,
      providerExecution: {
        status: "failed",
        providerName: task.providerName,
        realAi: Boolean(task.providerRawMeta?.realAi),
      },
      generationTrace,
      draftMarkdown: failedDraft,
      auditorMarkdown: buildAuditorResult({ providerKey, error, status: "failed", runMode, displayMode: taskBase.displayMode, apiConfig }),
      runDir,
      files,
    });

    error.runDir = runDir;
    error.files = files;
    throw error;
  }

  const task = buildTaskPayload({
    taskBase,
    providerResult,
    promptSummary,
    promptMeta,
    skillManifestSummary,
    runMode,
    apiConfig,
  });
  const generationTrace = renderGenerationTrace({
    input,
    task,
    providerKey,
    providerResult,
    promptMeta,
    promptSummary,
    skillManifest,
    skillManifestSummary,
    promptMarkdown,
    draftMarkdown: markdown,
  });

  await writeRunFiles({
    runDirAbs,
    task,
    input,
    providerKey,
    skillManifest,
    providerExecution: {
      status: "success",
      providerName: task.providerName,
      realAi: Boolean(task.providerRawMeta?.realAi),
    },
    generationTrace,
    draftMarkdown: markdown,
    auditorMarkdown: buildAuditorResult({ providerKey, providerResult, status: "success", runMode, displayMode: taskBase.displayMode, apiConfig }),
    runDir,
    files,
  });

  return {
    taskId: taskBase.taskId,
    status: "success",
    markdown,
    fileName,
    createdAt: taskBase.createdAt,
    runDir,
    absoluteRunDir: runDirAbs,
    files,
    provider: providerKey,
    runMode,
    displayMode: taskBase.displayMode,
    providerName: providerResult.providerName,
    modelName: providerResult.modelName,
    usage: providerResult.usage,
    manifestSummary,
    skillManifest: {
      writingSkill: skillManifestSummary.writingSkill,
      expansionSkill: skillManifestSummary.expansionSkill,
      production: false,
      productionRc: false,
      loadedAt: skillManifestSummary.loadedAt,
    },
  };
}

export async function createMockRun(input) {
  await loadLocalEnv(projectRoot);

  const runMode = normalizeRunMode(input);
  const displayMode = normalizeDisplayMode(input, runMode);
  const apiConfig = createApiConfig(input);
  const shouldCallMockProvider = runMode === "mock_run";
  const shouldCallApiProvider = runMode === "api_run";
  const providerLookup = shouldCallMockProvider ? getProvider("mock") : shouldCallApiProvider ? getProvider("openai_compatible") : null;
  const providerKey =
    runMode === "dry_run"
      ? "dry_run"
      : runMode === "codex_workspace"
        ? "codex_workspace"
        : runMode === "api_run"
          ? "openai_compatible"
          : providerLookup.key;
  const providerInfo = {
    key: providerKey,
    providerName: shouldCallMockProvider ? providerLookup.provider.providerName ?? providerKey : getProviderDisplayName(providerKey),
    modelName: shouldCallMockProvider
      ? providerLookup.provider.modelName ?? "unknown"
      : runMode === "api_run"
        ? apiConfig.model
        : "task-pack",
  };
  const timestamp = createTimestamp();
  const taskId = createTaskId(timestamp, input.sectionId);
  const createdAt = new Date().toISOString();
  const runDirName = `${timestamp}_${safeFileName(input.sectionId, "section")}`;
  const runDirAbs = path.join(runsRoot, runDirName);
  const runDir = path.posix.join("runs", runDirName);
  const fileName = buildFileName(input, runMode);
  const skillManifest = await loadCurrentSkillManifest();
  const skillManifestSummary = summarizeSkillManifest(skillManifest);
  const sectionContext = await loadSectionContext(input);
  const stageBoundary = createStageBoundary(runMode);

  const files = {
    task: path.posix.join(runDir, "task.json"),
    manifest: path.posix.join(runDir, "used_skill_manifest.md"),
    prompt: path.posix.join(runDir, "prompt.md"),
    generationTrace: path.posix.join(runDir, "generation_trace.md"),
    codexInstructions: path.posix.join(runDir, "codex_instructions.md"),
    codexInstructionsAbsolute: path.join(runDirAbs, "codex_instructions.md"),
    draft: path.posix.join(runDir, "draft.md"),
    auditor: path.posix.join(runDir, "auditor_result.md"),
    subsectionDrafts: path.posix.join(runDir, "subsection_drafts"),
    subsectionPrompts: path.posix.join(runDir, "subsection_prompts"),
  };

  const taskBase = {
    projectId: input.projectId,
    sectionId: input.sectionId,
    sectionTitle: input.sectionTitle,
    mode: input.mode,
    runMode,
    displayMode,
    skillProfile: input.skillProfile,
    provider: providerKey,
    providerName: providerInfo.providerName,
    modelName: providerInfo.modelName,
    taskId,
    createdAt,
  };

  await mkdir(runDirAbs, { recursive: true });

  if (runMode === "api_run") {
    return createApiSingleSubsectionRun({
      input: {
        ...input,
        runMode,
      },
      providerLookup,
      providerKey,
      providerInfo,
      taskBase,
      runDir,
      runDirAbs,
      files,
      skillManifest,
      skillManifestSummary,
      sectionContext,
      stageBoundary,
      fileName,
      runMode,
      apiConfig,
    });
  }

  if (runMode !== "mock_run") {
    return createTaskPackRun({
      input: {
        ...input,
        runMode,
      },
      providerKey,
      providerInfo,
      taskBase,
      runDir,
      runDirAbs,
      files,
      skillManifest,
      skillManifestSummary,
      sectionContext,
      stageBoundary,
      fileName,
      runMode,
      apiConfig,
    });
  }

  if (input.mode === "subsection_batch") {
    return createSubsectionBatchRun({
      input: {
        ...input,
        runMode,
      },
      providerLookup,
      providerKey,
      providerInfo,
      taskBase,
      runDir,
      runDirAbs,
      files,
      skillManifest,
      skillManifestSummary,
      sectionContext,
      stageBoundary,
      fileName,
      runMode,
      apiConfig,
    });
  }

  return createCompactRun({
    input: {
      ...input,
      runMode,
    },
    providerLookup,
    providerKey,
    providerInfo,
    taskBase,
    runDir,
    runDirAbs,
    files,
    skillManifest,
    skillManifestSummary,
    sectionContext,
    stageBoundary,
    fileName,
    runMode,
    apiConfig,
  });
}
