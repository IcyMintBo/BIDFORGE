const ruleSummaries = [
  "Writing Rule 001：写作重心实化",
  "Writing Rule 002：投标主体与落实路径",
  "Writing Rule 004：分析框架显性化控制",
  "Expansion Rule 007：扩写类型判断",
  "Expansion Rule 008：通用内容正文化填充",
  "Expansion Rule 009：关系逻辑型扩写信息密度控制",
];

function renderOutline(sectionContext) {
  const outline = sectionContext?.sectionOutline;
  if (!outline?.items?.length) {
    return "未找到完整章节目录。";
  }

  return [outline.title, ...outline.items.map((item) => `${item.id} ${item.title}`)].join("\n");
}

function renderFacts(sectionContext) {
  const facts = sectionContext?.sourceMaterials?.factSummaries ?? [];
  if (facts.length === 0) {
    return "本次未找到 source_materials，未注入项目事实材料。";
  }

  return facts.map((fact) => `* ${fact}`).join("\n");
}

function createPromptMeta({ promptMarkdown, sectionContext, mode, provider, subsectionLimit }) {
  const outlineItems = sectionContext?.sectionOutline?.items ?? [];
  const sourceMaterials = sectionContext?.sourceMaterials;
  const sourceLoaded = sourceMaterials?.status === "loaded";

  return {
    builder: "subsectionPromptBuilder",
    version: "mvp-v0.1",
    promptCharCount: promptMarkdown.length,
    targetStructure: mode,
    hasSectionOutline: outlineItems.length > 0,
    sectionOutlineItems: outlineItems.length,
    hasSourceMaterials: sourceLoaded,
    sourceMaterialsPath: sourceMaterials?.path ?? "",
    sourceMaterialsStatus: sourceMaterials?.status ?? "missing",
    sourceMaterialsCharCount: sourceMaterials?.charCount ?? 0,
    sourceMaterialFacts: sourceLoaded ? sourceMaterials.factSummaries : [],
    hasRuleSummaries: true,
    hasWordCountTarget: true,
    targetWordCountHint: "subsection_batch：每个小节 80–150 字左右，逐小节生成后合并。",
    hasOutputStructureRequirements: true,
    hasProviderDynamicTaskInstruction: true,
    targetSubsections: outlineItems.map((item) => `${item.id} ${item.title}`),
    targetSubsectionIds: outlineItems.map((item) => item.id),
    directoryFidelityRequired: Boolean(sectionContext?.sectionOutline?.directoryFidelityRequired),
    subsectionBatch: true,
    subsectionLimit: subsectionLimit ?? null,
    provider: provider.key,
    providerName: provider.providerName,
    injectedRules: ruleSummaries.map((summary) => ({
      skill: summary.includes("Writing") ? "Writing Candidate v0.3" : "Expansion Candidate v0.3",
      id: summary.split("：")[0],
      title: summary.split("：")[1],
      injection: "summary",
    })),
    injectedMaterials: [
      {
        id: "section_title",
        label: "章节编号与章节标题",
        injected: true,
      },
      {
        id: "section_outline",
        label: "完整章节目录",
        injected: outlineItems.length > 0,
        itemCount: outlineItems.length,
      },
      {
        id: "source_materials",
        label: "source_materials",
        injected: sourceLoaded,
        path: sourceMaterials?.path,
        charCount: sourceMaterials?.charCount ?? 0,
        facts: sourceLoaded ? sourceMaterials.factSummaries : [],
      },
      {
        id: "candidate_skill_context",
        label: "Candidate Skill 摘要",
        injected: true,
      },
    ],
  };
}

export function buildSubsectionBatchPrompt(context) {
  const { input, provider, sectionContext, task, subsectionLimit } = context;
  const outlineText = renderOutline(sectionContext);
  const factsText = renderFacts(sectionContext);
  const targetCount = sectionContext?.sectionOutline?.items?.length ?? 0;

  const promptMarkdown = `# BIDFORGE Subsection Batch Prompt

## 1. Task

* taskId：${task.taskId}
* projectId：${input.projectId}
* sectionId：${input.sectionId}
* sectionTitle：${input.sectionTitle}
* mode：subsection_batch
* provider：${provider.key}
* createdAt：${task.createdAt}

## 2. Strategy

本次不再一次性生成完整章节，而是拆分为小节级任务。Runner 将按目录顺序逐一生成小节，写入 subsection_drafts/，最后合并为 draft.md。

## 3. Section Outline

~~~text
${outlineText}
~~~

## 4. Source Materials

source_materials 状态：${sectionContext?.sourceMaterials?.status ?? "missing"}
source_materials 路径：${sectionContext?.sourceMaterials?.path || "未配置"}
source_materials 字符数：${sectionContext?.sourceMaterials?.charCount ?? 0}

${factsText}

## 5. Rules Injected

${ruleSummaries.map((rule) => `* ${rule}`).join("\n")}

## 6. Batch Requirements

* 目标小节数量：${targetCount}
* 本次测试限制：${subsectionLimit ? `前 ${subsectionLimit} 个小节` : "不限制"}
* 每个小节独立调用 Provider；
* 每个小节只输出自身标题和正文；
* 每个小节目标 80–150 字左右；
* 不输出其他小节内容；
* 不编造无依据事实；
* 不进入 Production；
* 不进入 Production RC。

## 7. Files To Write

~~~text
task.json
used_skill_manifest.md
prompt.md
generation_trace.md
draft.md
auditor_result.md
subsection_prompts/*.prompt.md
subsection_drafts/*.md
~~~`;

  const promptMeta = createPromptMeta({
    promptMarkdown,
    sectionContext,
    mode: input.mode,
    provider,
    subsectionLimit,
  });

  return {
    promptMarkdown,
    promptSummary: {
      builder: promptMeta.builder,
      version: promptMeta.version,
      mode: input.mode,
      provider: provider.key,
      providerName: provider.providerName,
      structures: [
        "Task",
        "Strategy",
        "Section Outline",
        "Source Materials",
        "Rules Injected",
        "Batch Requirements",
        "Files To Write",
      ],
      promptCharCount: promptMeta.promptCharCount,
      hasSectionOutline: promptMeta.hasSectionOutline,
      hasSourceMaterials: promptMeta.hasSourceMaterials,
      sectionOutlineItems: promptMeta.sectionOutlineItems,
      sourceMaterialsPath: promptMeta.sourceMaterialsPath,
      sourceMaterialsStatus: promptMeta.sourceMaterialsStatus,
      targetWordCountHint: promptMeta.targetWordCountHint,
      directoryFidelityRequired: promptMeta.directoryFidelityRequired,
      subsectionBatch: true,
    },
    promptMeta,
  };
}

export function buildSingleSubsectionPrompt({ input, provider, sectionContext, subsection, task }) {
  return `# BIDFORGE Subsection Prompt

## 1. Current Chapter

${input.sectionId} ${input.sectionTitle}

## 2. Current Subsection

${subsection.id} ${subsection.title}

## 3. Full Section Outline

~~~text
${renderOutline(sectionContext)}
~~~

## 4. Source Materials Summary

${renderFacts(sectionContext)}

## 5. Candidate Skill Rule Summary

${ruleSummaries.map((rule) => `* ${rule}`).join("\n")}

## 6. Output Instruction

请只生成当前小节，不要输出其他小节内容。

输出格式必须为：

~~~markdown
## ${subsection.id} ${subsection.title}

正文……
~~~

要求：

* 当前 Provider：${provider.providerName}（${provider.key}）；
* taskId：${task.taskId}；
* 字数目标：80–150 字左右；
* 使用 source_materials 中已有事实；
* 不编造未提供依据的具体数值、材料、设备参数；
* 不进入 Production；
* 不进入 Production RC。`;
}
