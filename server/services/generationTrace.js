function formatBoolean(value) {
  return value ? "是" : "否";
}

function formatValue(value, fallback = "未记录") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function renderFileList(files = []) {
  if (files.length === 0) {
    return "* 未记录";
  }

  return files.map((file) => `* ${file.path ?? file.name}：${file.status}，${file.charCount ?? 0} chars`).join("\n");
}

function renderRules(rules = []) {
  if (rules.length === 0) {
    return "* 本次未记录已注入规则。";
  }

  return rules.map((rule) => `* ${rule.skill} / ${rule.id}：${rule.title}（注入方式：${rule.injection}）`).join("\n");
}

function renderMaterials(materials = []) {
  if (materials.length === 0) {
    return "* 本次未记录注入材料。";
  }

  return materials
    .map((material) => {
      const detail = [];
      if (material.path) detail.push(`路径：${material.path}`);
      if (typeof material.charCount === "number") detail.push(`字符数：${material.charCount}`);
      if (typeof material.itemCount === "number") detail.push(`数量：${material.itemCount}`);
      if (material.reason) detail.push(material.reason);
      return `* ${material.label}：${material.injected ? "已注入" : "未注入"}${detail.length ? `；${detail.join("；")}` : ""}`;
    })
    .join("\n");
}

function renderSourceFacts(facts = []) {
  if (facts.length === 0) {
    return "* 本次未注入 source_materials 事实摘要。";
  }

  return facts.map((fact) => `* ${fact}`).join("\n");
}

function countMarkdownHeadings(markdown) {
  return (markdown.match(/^#{2,3}\s+/gm) ?? []).length;
}

function findCoveredTargetSubsections(markdown, targetIds = []) {
  return targetIds.filter((id) => new RegExp(`^#{2,3}\\s+${id.replaceAll(".", "\\.")}(\\s|$)`, "m").test(markdown));
}

function buildProviderSummary({ task, providerKey, providerResult, error }) {
  const rawMeta = providerResult?.rawMeta ?? error?.rawMeta ?? {};

  return {
    providerId: providerKey,
    providerName: providerResult?.providerName ?? task.providerName ?? providerKey,
    modelName: providerResult?.modelName ?? task.modelName ?? rawMeta.codexVersion ?? "unknown",
    realAi: Boolean(rawMeta.realAi),
    nonStreaming: true,
    exitCode: rawMeta.exitCode ?? "",
    timedOut: Boolean(rawMeta.timedOut),
    stdoutLength: rawMeta.stdoutLength ?? 0,
    apiCalled: Boolean(rawMeta.apiCalled),
    displayMode: task.displayMode ?? rawMeta.displayMode ?? "",
    isTaskPack: Boolean(task.isTaskPack ?? rawMeta.isTaskPack),
    isApiRun: Boolean(task.isApiRun),
    isDryRun: Boolean(task.isDryRun),
    isMockRun: Boolean(task.isMockRun),
    isCodexWorkspace: Boolean(task.isCodexWorkspace),
    maxOutputTokens: task.maxOutputTokens ?? rawMeta.maxOutputTokens ?? null,
    temperature: task.temperature ?? rawMeta.temperature ?? null,
    inputTokens: task.inputTokens ?? rawMeta.inputTokens ?? null,
    outputTokens: task.outputTokens ?? rawMeta.outputTokens ?? null,
    totalTokens: task.totalTokens ?? rawMeta.totalTokens ?? null,
    estimatedCost: task.estimatedCost ?? rawMeta.estimatedCost ?? null,
  };
}

function buildShortReason({ promptMeta, draftCharCount, mode, coveredCount, targetCount }) {
  const reasons = [];

  if (mode === "compact_section") {
    reasons.push("本次模式为 compact_section，目标是完整短段而不是长篇扩写");
  }

  if (mode === "subsection_batch") {
    reasons.push("本次模式为 subsection_batch，目标是逐小节短段生成后合并");
  }

  if (!promptMeta?.hasSectionOutline) {
    reasons.push("未注入完整章节目录");
  }

  if (!promptMeta?.hasSourceMaterials) {
    reasons.push("未注入 source_materials 或招标文件事实摘录");
  }

  if (targetCount > 0 && coveredCount < targetCount) {
    reasons.push(`draft.md 仅识别到 ${coveredCount}/${targetCount} 个目标小节`);
  }

  if (targetCount > 0 && draftCharCount < targetCount * 60) {
    reasons.push("draft.md 字符数低于当前模式的最低可读短段目标");
  }

  return reasons.join("；");
}

function renderSectionOutlineTrace(promptMeta) {
  if (!promptMeta?.hasSectionOutline) {
    return `* 是否注入章节目录：否
* 目录小节数量：0
* 是否要求目录保真：否
* 是否要求覆盖完整 5.1.1–5.1.15：否`;
  }

  return `* 是否注入章节目录：是
* 目录小节数量：${promptMeta.sectionOutlineItems}
* 是否要求目录保真：${formatBoolean(promptMeta.directoryFidelityRequired)}
* 是否要求覆盖完整 5.1.1–5.1.15：${formatBoolean(promptMeta.requiresFullSectionCoverage ?? true)}
* 目标小节：
${promptMeta.targetSubsections.map((item) => `  * ${item}`).join("\n")}`;
}

function renderSubsectionGeneration(subsectionSummary) {
  if (!subsectionSummary) {
    return `## 9. Subsection Generation

* 是否启用小节级生成：否`;
  }

  const lines = subsectionSummary.items
    .map((item) => {
      return `| ${item.id} | ${item.title} | ${item.provider} | ${item.status} | ${item.timedOut ? "是" : "否"} | ${item.outputCharCount} | ${item.fileName} |`;
    })
    .join("\n");

  return `## 9. Subsection Generation

* 是否启用小节级生成：是
* 目标小节数量：${subsectionSummary.targetCount}
* 本次执行小节数量：${subsectionSummary.attemptedCount}
* 成功小节数量：${subsectionSummary.successCount}
* 失败小节数量：${subsectionSummary.failedCount}
* 是否生成 subsection_drafts：${formatBoolean(subsectionSummary.subsectionDraftsWritten)}
* 是否生成 subsection_prompts：${formatBoolean(subsectionSummary.subsectionPromptsWritten)}
* 是否已合并 draft.md：${formatBoolean(subsectionSummary.draftMerged)}
* 是否 fallback 到 Mock：否

| 小节 | 标题 | provider | 状态 | 是否超时 | 输出字符数 | 文件 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- |
${lines || "| 未执行 | 未执行 | 未执行 | 未执行 | 否 | 0 | 未生成 |"}`;
}

export function renderGenerationTrace({
  input,
  task,
  providerKey,
  providerResult,
  error,
  promptMeta,
  promptSummary,
  skillManifest,
  skillManifestSummary,
  promptMarkdown,
  draftMarkdown,
  subsectionSummary,
}) {
  const provider = buildProviderSummary({ task, providerKey, providerResult, error });
  const draftCharCount = draftMarkdown.length;
  const markdownHeadingCount = countMarkdownHeadings(draftMarkdown);
  const targetIds = promptMeta?.targetSubsectionIds ?? [];
  const coveredTargetIds = findCoveredTargetSubsections(draftMarkdown, targetIds);
  const targetCount = targetIds.length;
  const coveredCount = coveredTargetIds.length;
  const missingTargetIds = targetIds.filter((id) => !coveredTargetIds.includes(id));
  const shortReason = buildShortReason({
    promptMeta,
    draftCharCount,
    mode: input.mode,
    coveredCount,
    targetCount,
  });
  const hasMergedOutline = targetCount > 0 && coveredCount < targetCount;

  return `# Generation Trace

## 1. Task Summary

* taskId：${task.taskId}
* sectionId：${input.sectionId}
* sectionTitle：${input.sectionTitle}
* mode：${input.mode}
* displayMode：${task.displayMode ?? "未记录"}
* runMode：${task.runMode ?? input.runMode ?? "mock_run"}
* provider：${providerKey}
* createdAt：${task.createdAt}

## 2. Provider

* provider id：${provider.providerId}
* provider name：${provider.providerName}
* 是否真实 AI：${formatBoolean(provider.realAi)}
* modelName：${provider.modelName}
* 是否非流式：${formatBoolean(provider.nonStreaming)}
* exitCode：${formatValue(provider.exitCode)}
* timedOut：${formatBoolean(provider.timedOut)}
* stdoutLength：${provider.stdoutLength}
* isApiRun：${formatBoolean(provider.isApiRun)}
* isDryRun：${formatBoolean(provider.isDryRun)}
* isMockRun：${formatBoolean(provider.isMockRun)}
* isCodexWorkspace：${formatBoolean(provider.isCodexWorkspace)}
* apiCalled：${formatBoolean(provider.apiCalled)}
* displayMode：${provider.displayMode || "未记录"}
* isTaskPack：${formatBoolean(provider.isTaskPack)}
* max_output_tokens：${formatValue(provider.maxOutputTokens)}
* temperature：${formatValue(provider.temperature)}
* inputTokens：${formatValue(provider.inputTokens)}
* outputTokens：${formatValue(provider.outputTokens)}
* totalTokens：${formatValue(provider.totalTokens)}
* estimatedCost：${formatValue(provider.estimatedCost)}

## 3. Skill Files Loaded

### Writing Candidate v0.3

${renderFileList(skillManifest?.writingSkill?.files ?? skillManifestSummary?.writingFiles)}

### Expansion Candidate v0.3

${renderFileList(skillManifest?.expansionSkill?.files ?? skillManifestSummary?.expansionFiles)}

### 状态文档

${renderFileList(skillManifest?.docs ?? skillManifestSummary?.docs)}

说明：完整读取清单以 used_skill_manifest.md 为准，本文件只记录本次生成链路摘要。

## 4. Skill Rules Injected Into Prompt

${renderRules(promptMeta?.injectedRules)}

当前仅注入规则摘要，尚未逐条注入完整 rules.md 正文。读取了完整 rules.md，但本次 prompt 未注入完整规则正文。

## 5. Source Materials Injected

* 是否注入 source_materials：${formatBoolean(promptMeta?.hasSourceMaterials)}
* source_materials 路径：${promptMeta?.sourceMaterialsPath || "未配置"}
* source_materials 状态：${promptMeta?.sourceMaterialsStatus ?? "missing"}
* source_materials 字符数：${promptMeta?.sourceMaterialsCharCount ?? 0}

### 注入材料摘要

${renderMaterials(promptMeta?.injectedMaterials)}

### 注入事实摘要

${renderSourceFacts(promptMeta?.sourceMaterialFacts)}

${promptMeta?.hasSourceMaterials ? "本次已注入 source_materials 摘要，输出应优先使用其中的项目事实。" : "本次未找到 source_materials，未注入项目事实材料。"}

## 6. Section Outline Injected

${renderSectionOutlineTrace(promptMeta)}

## 7. Prompt Assembly

* promptBuilder：${promptMeta?.builder ?? promptSummary?.builder ?? "promptBuilder"}
* promptBuilder 版本：${promptMeta?.version ?? promptSummary?.version ?? "unknown"}
* prompt.md 主要结构：${(promptSummary?.structures ?? []).join(" / ")}
* prompt 字符数：${promptMeta?.promptCharCount ?? promptMarkdown.length}
* 是否包含 Provider 动态 Task Instruction：${formatBoolean(promptMeta?.hasProviderDynamicTaskInstruction)}
* 是否包含 Candidate Skill Context：是
* 是否包含具体规则摘要：${formatBoolean(promptMeta?.hasRuleSummaries)}
* 是否包含章节目录：${formatBoolean(promptMeta?.hasSectionOutline)}
* 目录小节数量：${promptMeta?.sectionOutlineItems ?? 0}
* 是否要求目录保真：${formatBoolean(promptMeta?.directoryFidelityRequired)}
* 是否包含 source_materials：${formatBoolean(promptMeta?.hasSourceMaterials)}
* 是否包含字数目标：${formatBoolean(promptMeta?.hasWordCountTarget)}
* 字数目标：${promptMeta?.targetWordCountHint || "未设置"}
* 是否包含输出结构要求：${formatBoolean(promptMeta?.hasOutputStructureRequirements)}
* targetStructure：${promptMeta?.targetStructure ?? input.mode}

## 8. Output Summary

* draft.md 字符数：${draftCharCount}
* Markdown 小节标题数量：${markdownHeadingCount}
* 目标小节数量：${targetCount}
* 实际覆盖目标小节数量：${coveredCount}
* 已覆盖小节：${coveredTargetIds.length ? coveredTargetIds.join("、") : "未识别到"}
* 未覆盖小节：${missingTargetIds.length ? missingTargetIds.join("、") : "无"}
* 是否覆盖 5.1.1–5.1.15：${formatBoolean(targetCount > 0 && coveredCount === targetCount)}
* 是否存在合并目录或缺失目录：${formatBoolean(hasMergedOutline)}
* 是否明显偏短：${formatBoolean(Boolean(shortReason && (coveredCount < targetCount || draftCharCount < targetCount * 60)))}
* 偏短原因判断：${shortReason || "当前已注入章节目录、source_materials 和字数目标。"}

${renderSubsectionGeneration(subsectionSummary)}

## 10. Next Improvement Suggestion

* 如需更长输出，应新增或切换 expanded_section 模式；
* 如需提高 Local Codex 稳定性，应继续优化小节级 prompt 和单节超时；
* 如需进一步增强项目事实，应继续补充 source_materials；
* ${
    providerKey === "openai_compatible"
      ? provider.apiCalled
        ? "本次已调用 OpenAI-Compatible API Provider 的 Direct Forge 单小节非流式生成"
        : "本次进入 OpenAI-Compatible API Provider 分支，但未发起 API 请求"
      : "当前未使用 OpenAI-Compatible API Provider"
  }；
* 当前不进入 Production；
* 当前不进入 Production RC。`;
}
