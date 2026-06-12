function renderFileList(files) {
  const lines = [
    files.prompt ? `* ${files.prompt}` : "",
    files.generationTrace ? `* ${files.generationTrace}` : "",
    files.manifest ? `* ${files.manifest}` : "",
    files.subsectionPrompts ? `* ${files.subsectionPrompts}/` : "",
  ].filter(Boolean);

  return lines.join("\n");
}

function normalizeWindowsPath(filePath) {
  return String(filePath ?? "").replaceAll("/", "\\");
}

export function renderCodexWorkspaceInstructions({ input, task, runDir, runDirAbs, files, subsectionSummary }) {
  const hasSubsectionBatch = input.mode === "subsection_batch" || Boolean(subsectionSummary);
  const absoluteRunDir = normalizeWindowsPath(runDirAbs);
  const absoluteInstructionPath = files.codexInstructionsAbsolute ?? `${absoluteRunDir}\\codex_instructions.md`;
  const relativeInstructionPath = files.codexInstructions ?? `${runDir}/codex_instructions.md`;
  const absoluteDraftPath = `${absoluteRunDir}\\draft.md`;
  const subsectionOutput = hasSubsectionBatch
    ? `
小节级输出：

* 请按 subsection_prompts/ 中的小节 prompt 逐个生成；
* 每个小节结果写入 subsection_drafts/*.md；
* 最终按章节目录顺序合并写入 draft.md。
`
    : "";

  return `# BIDFORGE Agent Pack Instructions

## 1. 当前 run

* 本机绝对路径：${absoluteRunDir}
* 项目内相对路径：${runDir}
* taskId：${task.taskId}
* sectionId：${input.sectionId}
* sectionTitle：${input.sectionTitle}
* mode：${input.mode}
* displayMode：${task.displayMode ?? "agent_pack"}
* provider：Agent Pack

## 2. 请先读取

${renderFileList(files)}

## 3. 输出路径

整章结果：
* ${files.draft}
* ${absoluteDraftPath}
${subsectionOutput}

## 4. 执行要求

请在真实 Codex / Claude Code / Cursor / 其他外部 Agent 环境中完成本次 BIDFORGE run。

要求：
* 读取 prompt.md；
* 参考 generation_trace.md；
* 参考 used_skill_manifest.md；
* 如果存在 subsection_prompts/，请按小节 prompt 逐个生成；
* 正文写入 draft.md；
* 小节结果写入 subsection_drafts/*.md；
* 不修改 Candidate Skill；
* 不修改规则库；
* 不修改 skills / knowledge；
* 不进入 Production；
* 不进入 Production RC；
* 不编造无依据事实。

## 5. 可复制给 Agent 的指令

\`\`\`text
请读取以下任务说明文件，并按其中要求完成本次 BIDFORGE run：
${absoluteInstructionPath}

如果当前环境无法访问该绝对路径，请在 BIDFORGE 项目根目录下读取：
${relativeInstructionPath}

完成后请将正文写入：
${absoluteDraftPath}

如果按小节生成，请将小节结果写入 subsection_drafts/，并最终合并写入 draft.md。
\`\`\`
`;
}
