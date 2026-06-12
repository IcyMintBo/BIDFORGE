const promptSections = [
  "Task",
  "Stage Boundary",
  "Candidate Skill Context",
  "Section Outline",
  "Source Materials",
  "Skill Rule Summary Injected",
  "Task Instruction",
  "Output Requirements",
  "Files To Write",
];

const injectedRules = [
  {
    skill: "Writing Candidate v0.3",
    id: "Rule 001",
    title: "写作重心实化",
    injection: "summary",
  },
  {
    skill: "Writing Candidate v0.3",
    id: "Rule 002",
    title: "投标主体与落实路径",
    injection: "summary",
  },
  {
    skill: "Writing Candidate v0.3",
    id: "Rule 004",
    title: "分析框架显性化控制",
    injection: "summary",
  },
  {
    skill: "Expansion Candidate v0.3",
    id: "Rule 007",
    title: "扩写类型判断",
    injection: "summary",
  },
  {
    skill: "Expansion Candidate v0.3",
    id: "Rule 008",
    title: "通用内容正文化填充",
    injection: "summary",
  },
  {
    skill: "Expansion Candidate v0.3",
    id: "Rule 009",
    title: "关系逻辑型扩写信息密度控制",
    injection: "summary",
  },
];

function countLoaded(files = []) {
  return files.filter((file) => file.status === "loaded").length;
}

function buildTaskInstruction(mode, provider) {
  if (mode !== "compact_section") {
    return `当前暂不支持 ${mode} 模式，请保持任务边界并返回清晰错误。`;
  }

  if (provider.key === "mock") {
    return "请为指定章节生成精简版 Markdown 草稿。当前 Provider 为 Mock Provider，本次用于 MVP 流程验证，正文可为 mockProvider 输出。";
  }

  if (provider.key === "local_codex") {
    return "请为指定章节生成精简版 Markdown 草稿。当前 Provider 为 Local Codex Provider，本次将调用当前电脑上的 Codex CLI 以非流式方式生成 Markdown 草稿。";
  }

  if (provider.key === "local_openai") {
    return "请为指定章节生成精简版 Markdown 草稿。当前 Provider 为 Local OpenAI API Provider，后续将读取本机配置的 API Key 调用 OpenAI API。当前阶段如未接入真实调用，应返回未配置或未接入状态。";
  }

  if (provider.key === "cloud_api") {
    return "请为指定章节生成精简版 Markdown 草稿。当前 Provider 为 Cloud API Provider，但云端服务当前仅为未来占位，不应执行真实生成。";
  }

  return `请为指定章节生成精简版 Markdown 草稿。当前 Provider 为 ${provider.providerName}（${provider.key}），请遵守当前 Provider 边界。`;
}

function formatBoolean(value) {
  return value ? "是" : "否";
}

function renderSectionOutline(sectionContext) {
  const outline = sectionContext?.sectionOutline;

  if (!outline?.items?.length) {
    return "本次未找到完整章节目录，仅使用 task input 中的章节编号和标题。";
  }

  return [
    outline.title,
    ...outline.items.map((item) => `${item.id} ${item.title}`),
  ].join("\n");
}

function renderSourceMaterials(sourceMaterials) {
  if (sourceMaterials?.status !== "loaded") {
    return `本次未找到 source_materials，未注入项目事实材料。\n\n目标路径：${sourceMaterials?.path || "未配置"}`;
  }

  const facts = sourceMaterials.factSummaries.map((fact) => `* ${fact}`).join("\n");

  return `已读取 source_materials：${sourceMaterials.path}
字符数：${sourceMaterials.charCount}

本次注入以下事实摘要：

${facts}`;
}

function renderRuleSummary() {
  const writingRules = injectedRules.filter((rule) => rule.skill === "Writing Candidate v0.3");
  const expansionRules = injectedRules.filter((rule) => rule.skill === "Expansion Candidate v0.3");

  const renderRules = (rules) => rules.map((rule) => `* ${rule.id}：${rule.title}（注入方式：规则摘要）`).join("\n");

  return `当前仅注入规则摘要，尚未逐条注入完整 rules.md 正文。

### Writing Candidate v0.3

${renderRules(writingRules)}

### Expansion Candidate v0.3

${renderRules(expansionRules)}`;
}

function buildPromptBuilderSummary(sectionContext) {
  const hasSectionOutline = (sectionContext?.sectionOutline?.items ?? []).length > 0;
  const hasSourceMaterials = sectionContext?.sourceMaterials?.status === "loaded";
  const injected = [];
  const missing = [];

  if (hasSectionOutline) {
    injected.push("完整章节目录");
  } else {
    missing.push("完整章节目录");
  }

  if (hasSourceMaterials) {
    injected.push("source_materials 摘要");
  } else {
    missing.push("source_materials");
  }

  injected.push("章节编号与章节标题", "Candidate Skill 摘要与关键规则摘要");
  missing.push("完整 rules.md 正文", "历史人工样本", "反面样本");

  return {
    injectedLine: `当前注入：${injected.join("、")}；`,
    missingLine: `当前未注入：${missing.join("、")}；`,
  };
}

function createInjectedMaterials(sectionContext) {
  const outlineItems = sectionContext?.sectionOutline?.items ?? [];
  const sourceMaterials = sectionContext?.sourceMaterials;
  const sourceLoaded = sourceMaterials?.status === "loaded";

  return [
    {
      id: "section_title",
      label: "章节编号与章节标题",
      injected: true,
    },
    {
      id: "section_outline",
      label: "完整章节目录",
      injected: outlineItems.length > 0,
      path: "server/services/sectionContextLoader.js",
      itemCount: outlineItems.length,
      reason: outlineItems.length > 0 ? undefined : "本阶段未找到完整章节目录。",
    },
    {
      id: "candidate_skill_context",
      label: "Candidate Skill 摘要",
      injected: true,
    },
    {
      id: "source_materials",
      label: "source_materials",
      injected: sourceLoaded,
      path: sourceMaterials?.path,
      charCount: sourceMaterials?.charCount ?? 0,
      facts: sourceLoaded ? sourceMaterials.factSummaries : [],
      reason: sourceLoaded ? undefined : "本次未找到 source_materials，未注入项目事实材料。",
    },
    {
      id: "tender_fact_extracts",
      label: "招标文件事实摘录",
      injected: sourceLoaded,
      path: sourceMaterials?.path,
      reason: sourceLoaded ? "通过 source_materials 摘要注入。" : "本阶段未解析 PDF/DOCX。",
    },
    {
      id: "historical_samples",
      label: "历史人工样本",
      injected: false,
      reason: "本阶段未注入 source_cases 正文。",
    },
    {
      id: "negative_samples",
      label: "反面样本",
      injected: false,
      reason: "本阶段未注入反面样本。",
    },
  ];
}

function createPromptMeta({ promptMarkdown, mode, provider, sectionContext }) {
  const outlineItems = sectionContext?.sectionOutline?.items ?? [];
  const sourceMaterials = sectionContext?.sourceMaterials;
  const sourceLoaded = sourceMaterials?.status === "loaded";

  return {
    builder: "promptBuilder",
    version: "mvp-v0.3",
    injectedRules,
    injectedMaterials: createInjectedMaterials(sectionContext),
    promptCharCount: promptMarkdown.length,
    hasSectionOutline: outlineItems.length > 0,
    sectionOutlineItems: outlineItems.length,
    hasSourceMaterials: sourceLoaded,
    sourceMaterialsPath: sourceMaterials?.path ?? "",
    sourceMaterialsStatus: sourceMaterials?.status ?? "missing",
    sourceMaterialsCharCount: sourceMaterials?.charCount ?? 0,
    sourceMaterialFacts: sourceLoaded ? sourceMaterials.factSummaries : [],
    hasRuleSummaries: true,
    hasWordCountTarget: true,
    targetWordCountHint: sectionContext?.targetWordCountHint ?? "",
    hasOutputStructureRequirements: true,
    hasProviderDynamicTaskInstruction: true,
    targetStructure: mode,
    targetSubsections: outlineItems.map((item) => `${item.id} ${item.title}`),
    targetSubsectionIds: outlineItems.map((item) => item.id),
    directoryFidelityRequired: Boolean(sectionContext?.sectionOutline?.directoryFidelityRequired),
    provider: provider.key,
    providerName: provider.providerName,
  };
}

export function buildPrompt(context) {
  const { task, provider, skillManifest, mode, section, stage, sectionContext } = context;
  const writingLoaded = countLoaded(skillManifest.writingFiles);
  const expansionLoaded = countLoaded(skillManifest.expansionFiles);
  const docsLoaded = countLoaded(skillManifest.docs);
  const outlineText = renderSectionOutline(sectionContext);
  const sourceMaterialsText = renderSourceMaterials(sectionContext?.sourceMaterials);
  const promptBuilderSummary = buildPromptBuilderSummary(sectionContext);

  const promptMarkdown = `# BIDFORGE Run Prompt

## 1. Task

* taskId：${task.taskId}
* projectId：${task.projectId}
* sectionId：${section.id}
* sectionTitle：${section.title}
* mode：${mode}
* provider：${provider.key}
* createdAt：${task.createdAt}

## 2. Stage Boundary

* 当前为 MVP 功能阶段；
* 当前 Provider：${provider.providerName}（${provider.key}）；
* 当前是否接真实 AI：${formatBoolean(stage.realAi)}；
* 是否解析 PDF/DOCX：${formatBoolean(stage.parseSourceFiles)}；
* 是否进入 Production：${formatBoolean(stage.production)}；
* 是否进入 Production RC：${formatBoolean(stage.productionRc)}；
* 当前是否允许生成正式正文：${formatBoolean(stage.allowFormalProductionDraft)}。

## 3. Candidate Skill Context

* Writing Candidate v0.3：${skillManifest.writingSkill}；
* Expansion Candidate v0.3：${skillManifest.expansionSkill}；
* 已生成 used_skill_manifest.md；
* Writing Candidate 已读取文件：${writingLoaded}/${skillManifest.writingFiles.length}；
* Expansion Candidate 已读取文件：${expansionLoaded}/${skillManifest.expansionFiles.length}；
* 状态文档已读取文件：${docsLoaded}/${skillManifest.docs.length}；
* 本次 prompt 应遵守当前 Candidate Skill 边界；
* 不得误用旧版本；
* 不得进入 Production / RC。

## 4. Section Outline

本次必须保持章节目录保真，按以下 5.1.1–5.1.15 目录输出。不得自行合并、删减或改写小节标题。

~~~text
${outlineText}
~~~

## 5. Source Materials

${sourceMaterialsText}

## 6. Skill Rule Summary Injected

${renderRuleSummary()}

## 7. Task Instruction

${buildTaskInstruction(mode, provider)}

## 8. Output Requirements

* 输出 Markdown；
* 保持正式标书正文口吻；
* 必须保持章节目录保真；
* 不得自行合并、删减或改写 5.1.1–5.1.15 小节标题；
* compact_section 模式下，每个小节可控制为短段，但应覆盖完整目录；
* 当前长度目标：${sectionContext?.targetWordCountHint ?? "compact_section：每个小节 80–150 字左右。"}
* 优先使用 source_materials 中的项目事实；
* 未提供依据的具体数值、材料、设备参数不得编造；
* 不写入 Production / RC 声明到正文；
* 不扩大服务范围；
* 不把 mock 状态伪装成真实 AI 结果。

## 9. Files To Write

本次 run 应写入：

~~~text
task.json
used_skill_manifest.md
prompt.md
generation_trace.md
draft.md
auditor_result.md
~~~

## Prompt Builder Summary

* promptBuilder：已使用；
* prompt 来源：task + provider + skill manifest + section context；
* ${promptBuilderSummary.injectedLine}
* ${promptBuilderSummary.missingLine}
* 后续真实 Provider 应直接读取本 prompt 执行生成。`;

  const promptMeta = createPromptMeta({
    promptMarkdown,
    mode,
    provider,
    sectionContext,
  });

  return {
    promptMarkdown,
    promptSummary: {
      builder: promptMeta.builder,
      version: promptMeta.version,
      mode,
      provider: provider.key,
      providerName: provider.providerName,
      modelName: provider.modelName,
      realAi: stage.realAi,
      parseSourceFiles: stage.parseSourceFiles,
      production: stage.production,
      productionRc: stage.productionRc,
      allowFormalProductionDraft: stage.allowFormalProductionDraft,
      skillManifestLoaded: true,
      writingSkill: skillManifest.writingSkill,
      expansionSkill: skillManifest.expansionSkill,
      structures: promptSections,
      promptCharCount: promptMeta.promptCharCount,
      hasRuleSummaries: promptMeta.hasRuleSummaries,
      hasSourceMaterials: promptMeta.hasSourceMaterials,
      hasSectionOutline: promptMeta.hasSectionOutline,
      sectionOutlineItems: promptMeta.sectionOutlineItems,
      sourceMaterialsPath: promptMeta.sourceMaterialsPath,
      sourceMaterialsStatus: promptMeta.sourceMaterialsStatus,
      targetWordCountHint: promptMeta.targetWordCountHint,
      directoryFidelityRequired: promptMeta.directoryFidelityRequired,
    },
    promptMeta,
  };
}
