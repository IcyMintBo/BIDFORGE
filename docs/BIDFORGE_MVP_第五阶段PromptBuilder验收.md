# BIDFORGE MVP 第五阶段 promptBuilder 验收

## 1. 阶段目标

本阶段目标为：

```text
POST /api/runs
→ 读取 task input
→ 读取 provider
→ 读取 skill manifest
→ promptBuilder 生成 prompt.md
→ provider 根据同一上下文生成 draft.md
→ task / manifest / prompt / draft / auditor 全部落盘
```

本阶段仅完成 prompt 组装机制，不接真实 Codex，不接真实 OpenAI API，不解析 PDF/DOCX，不进入 Production / Production RC。

## 2. 已完成能力

本阶段已完成以下能力：

* 新增 `server/services/promptBuilder.js`；
* `prompt.md` 不再由 runner 内部固定字符串手写生成；
* `prompt.md` 由 task、provider、skill manifest、section、stage boundary 自动组装；
* `prompt.md` 包含 Task / Stage Boundary / Candidate Skill Context / Task Instruction / Output Requirements / Files To Write；
* `task.json` 可记录 `promptSummary`；
* provider 调用可接收同一上下文；
* `mockProvider` 的 `rawMeta` 可记录 `promptBuilderUsed: true`；
* `auditor_result.md` 可记录 promptBuilder 检查项；
* 当前仍使用 mockProvider；
* `npm run build` 通过。

## 3. 人工验收结论

本阶段已通过人工验收。

人工查看测试 run 后确认：

* Mock Provider 仍可正常生成；
* run 目录仍包含完整文件；
* `prompt.md` 已由 promptBuilder 生成；
* `prompt.md` 包含 Task；
* `prompt.md` 包含 Stage Boundary；
* `prompt.md` 包含 Candidate Skill Context；
* `prompt.md` 包含 Task Instruction；
* `prompt.md` 包含 Output Requirements；
* `prompt.md` 包含 Files To Write；
* `task.json` 已记录 `promptSummary`；
* `auditor_result.md` 已记录 promptBuilder 检查项；
* `providerRawMeta.promptBuilderUsed` 为 true；
* 当前未接真实 AI；
* 当前未进入 Production；
* 当前未进入 Production RC。

验收参考 run：

```text
runs/20260610102108104_5.1/
```

## 4. 当前 run 文件结构

当前 run 目录包含：

```text
task.json
used_skill_manifest.md
prompt.md
draft.md
auditor_result.md
```

其中：

* `task.json` 记录任务、provider、skillManifest、promptSummary；
* `used_skill_manifest.md` 记录本次任务实际读取的 Candidate Skill 与状态文档；
* `prompt.md` 由 promptBuilder 根据 task、provider、skill manifest、section、stage boundary 生成；
* `draft.md` 仍由 mockProvider 生成；
* `auditor_result.md` 记录 promptBuilder、Skill Loader、Provider Adapter 和阶段边界检查。

## 5. 当前仍未接入内容

当前明确未接入以下内容：

* 不接真实 Codex；
* 不接真实 OpenAI API；
* 不接 API Key；
* 不做流式输出；
* 不解析 PDF/DOCX；
* 不做 Word 导出；
* 正文仍由 mockProvider 生成；
* 不进入 Production；
* 不进入 Production RC。

## 6. 阶段意义

本阶段完成后，BIDFORGE 已从“任务能记录规则来源”升级为“任务能稳定组装生成提示词”。

后续接真实 Codex / OpenAI 前，Runner 已具备统一 prompt 构建入口。Provider 不需要各自散落拼接提示词，而是可以读取同一份结构化 prompt，并基于同一 task、provider、skill manifest 和 stage boundary 执行生成。

这可以降低后续真实生成时提示词口径不一致、误用旧规则、误进入 Production / RC、把 mock 状态伪装成真实 AI 结果的风险。

## 7. 下一步建议

推荐下一阶段为：

```text
第六阶段：真实 Runner 状态面板 / latest run 读取
```

目标：

```text
前端本地 Runner 面板读取 /api/health 或新增只读接口
展示 Runner 是否在线、当前支持 Provider、最新 run 目录和最新 run 文件
```

理由：

* 当前 Runner 已具备 Provider Adapter、Skill Loader、promptBuilder 和文件落盘；
* 前端顶部已有“本地 Runner”入口；
* 增加只读状态面板能提升用户可见进度；
* 暂时不直接接真实 Codex，避免过早进入复杂集成；
* 为后续真实 Codex Provider 接入前提供更清楚的本地运行状态观察能力。
