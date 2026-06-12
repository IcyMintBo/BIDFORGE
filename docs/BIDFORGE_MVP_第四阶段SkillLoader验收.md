# BIDFORGE MVP 第四阶段 Skill Loader 验收

## 1. 阶段目标

本阶段目标为：

```text
前端点击生成
→ POST /api/runs
→ 后端读取当前有效 Candidate Skill
→ 后端读取状态收口文档
→ 生成 used_skill_manifest.md
→ task.json 记录 skillManifest
→ prompt.md 引用 manifest
→ auditor_result.md 记录 manifest 检查
```

## 2. 已完成能力

本阶段已完成以下能力：

* 新增 `server/services/skillLoader.js`；
* 可读取 Writing Candidate v0.3；
* 可读取 Expansion Candidate v0.3；
* 可读取状态文档；
* 每次 run 可生成 `used_skill_manifest.md`；
* `task.json` 可记录 skillManifest；
* `prompt.md` 可引用 manifest；
* `auditor_result.md` 可记录 manifest 检查；
* 当前仍使用 mockProvider；
* `npm run build` 通过。

## 3. 人工验收结论

本阶段已通过人工验收。

人工查看 `used_skill_manifest.md` 后确认：

* 当前任务信息记录完整；
* 当前有效 Candidate Skill 记录正确；
* Writing Candidate 为 v0.3；
* Expansion Candidate 为 v0.3；
* 已读取对应 Candidate Skill 文件；
* 已读取状态文档；
* Production 为否；
* Production RC 为否；
* 当前未接真实 AI；
* 当前未解析 PDF/DOCX。

## 4. 当前 run 文件结构

当前 run 目录包含：

```text
task.json
used_skill_manifest.md
prompt.md
draft.md
auditor_result.md
```

`used_skill_manifest.md` 用于记录本次任务实际读取的 Candidate Skill、状态文档和阶段边界，是后续接真实 Codex / OpenAI 前的重要追溯文件。

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

本阶段完成后，BIDFORGE 已从“任务能落盘”升级为“任务能记录规则来源”。

后续接真实 Codex / OpenAI 前，系统已经具备规则追溯基础。每次生成都能确认当前使用 Writing v0.3 和 Expansion v0.3，并能记录对应 Candidate Skill 文件、状态文档、Production 边界和真实 AI 接入状态。

这可以降低后续真实生成时误读旧规则、误进 Production / RC、误把 mock 结果当作真实 AI 生成结果的风险。

## 7. 下一步建议

推荐下一阶段为：

```text
第五阶段：promptBuilder
```

目标：

```text
根据 task.json + used_skill_manifest.md + section 信息 + provider 信息
自动生成结构化 prompt.md
```

理由：

* 当前 prompt.md 仍偏固定 mock；
* 接真实 Codex 前需要稳定的 prompt 组装机制；
* promptBuilder 完成后，Codex Provider 只需要执行 prompt；
* 可以避免把提示词散落在 provider 或 runner 代码里。
