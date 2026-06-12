# BIDFORGE 当前阶段状态收口（2026-06）

## 1. 当前阶段

当前 BIDFORGE 处于本地 AI 标书工作台 MVP 与 Candidate Skill 验证并行阶段。

当前仍不进入 Production，不进入 Production RC，不更新正式 `skills/knowledge`。当前有效规则仍以 Candidate Skill 形式保留，前台和本地 Runner 仅用于 MVP 验证、任务包生成、上下文追踪和后续真实 Provider 接入准备。

## 2. 前台 UI 状态

前台 UI 已从静态高保真原型推进到可交互本地 MVP。

已具备：

* 顶部系统工具栏；
* 首页工作台；
* 项目资料面板；
* 质量面板；
* 章节进度面板；
* 风险面板；
* 导出文档弹窗；
* API / Provider 配置中心；
* 本地 Runner 状态面板；
* 主编辑区 Markdown 预览；
* Markdown 下载；
* Agent Pack 指令复制与结果读取入口。

当前前台运行方式已收口为：

```text
Direct Forge
Agent Pack
```

### Direct Forge

Direct Forge 用于后续在 BIDFORGE 内部调用 OpenAI-Compatible API Provider 直接生成正文。

当前状态：

* 前台可选择；
* 点击生成前有真实 API 调用确认；
* 后端映射为 `api_run`；
* 当前仍不真实调用 API；
* 当前记录 `apiCalled=false`；
* 当前仅生成 API Run 准备上下文。

### Agent Pack

Agent Pack 用于生成可交给 Codex、Claude Code、龙虾、Cursor 等外部 Agent 使用的任务包。

当前状态：

* 前台可选择；
* 后端映射为 `codex_workspace`；
* 不调用真实 API；
* 不调用 `codex exec`；
* 可生成 `codex_instructions.md`；
* 可生成 `subsection_prompts/`；
* 指令中包含本机绝对路径和项目内相对路径；
* 外部 Agent 完成后，可回到 BIDFORGE 读取 `draft.md`。

Mock 能力仍保留为开发者调试能力，不再作为普通前台主入口展示。

## 3. 本地 Runner 状态

本地 Runner 已具备真实落盘能力。

当前已具备：

* `POST /api/runs`；
* `GET /api/runs/result`；
* `GET /api/runner/status`；
* `GET /api/providers/status`；
* Provider Adapter；
* Skill Loader；
* `used_skill_manifest.md`；
* promptBuilder；
* generation trace；
* subsection prompt builder；
* Agent Pack instructions；
* latest run 读取。

当前 run 目录可包含：

```text
task.json
used_skill_manifest.md
prompt.md
generation_trace.md
draft.md
auditor_result.md
codex_instructions.md
subsection_prompts/
subsection_drafts/
```

当前限制：

* 不解析真实 PDF/DOCX；
* 不写 Word；
* 不做在线账号；
* 不做 Cloud API；
* 不做 SkillBundle；
* 不做 Local Access Gate；
* 不进入 Production；
* 不进入 Production RC。

## 4. Provider 状态

当前 Provider 路线如下：

### Mock Provider

用途：

* 开发调试；
* UI 演示；
* Runner 流程验证；
* subsection_batch 测试。

当前状态：

* 后端能力保留；
* 不作为普通前台主模式展示；
* 不调用真实 AI；
* 不消耗 API。

### Agent Pack / Codex Workspace

用途：

* 用户本人在外部 Codex / Claude Code / Cursor 等 Agent 中执行任务包；
* Skill 调试；
* 外部 Agent 协作；
* 结果回填。

当前状态：

* 作为前台 `Agent Pack` 对外表达；
* 不自动调用 Codex；
* 不调用 `codex exec`；
* 不调用 API；
* 可生成任务包；
* 可读取结果。

### OpenAI-Compatible API Provider

用途：

* 后续 Direct Forge 自动生成主线；
* 适配 OpenAI 官方 API 或 OpenAI-compatible 模型接口。

当前状态：

* Provider 配置中心已有占位；
* 支持 Base URL / API Key 状态 / Model / max_output_tokens / temperature 的结构展示；
* 后端 Provider 仍为占位；
* 当前不真实调用 API；
* 当前不读取或保存真实 API Key；
* 当前不产生费用。

### Local Codex Auto

Local Codex Provider 曾完成非流式 MVP 接入，但后续排查显示当前 `codex exec` 非交互调用 smoke test 在当前环境下会超时。

当前结论：

* 保留为实验性高级能力；
* 不作为默认路线；
* 不继续死磕 `codex exec`；
* 用户本人 Codex 工作流短期优先通过 Agent Pack 方式完成。

### Cloud API Provider

当前仅为未来占位。

当前不租服务器，不做云端账号，不做统一 API 调用。

## 5. 当前有效候选 Skill

当前有效候选 Skill 为：

```text
candidate_skills/bidforge-writing-candidate-v0.3/
candidate_skills/bidforge-expansion-candidate-v0.3/
```

### Writing Candidate v0.3

Writing Candidate v0.3 负责精简小节写作，重点控制正式标书口吻、写作重心实化、投标主体表达、分析框架显性化、空泛表达、越界表达和过度承诺。

### Expansion Candidate v0.3

Expansion Candidate v0.3 负责扩写能力验证，重点包括扩写正文、扩写类型判断、通用内容正文化、关系逻辑型信息密度控制、连续去重、角色分离、单小点一万字级内部模块化和模块内压缩取舍。

Expansion Candidate v0.3 新增规则包括：

* Rule 007：扩写类型判断规则；
* Rule 008：通用内容正文化填充规则；
* Rule 009：关系逻辑型扩写信息密度规则。

v0.3 仍为 Candidate，不进入 Production，不进入 Production RC，不更新正式 `skills/knowledge`。

## 6. 建筑设计 5.1 能力验证状态

`5.1 建筑设计` 已完成章节目录与 source_materials 注入验证。

当前已具备：

* 5.1.1–5.1.15 完整目录注入；
* `trials/architectural_design_5_1/input/source_materials.md` 注入；
* `generation_trace.md` 记录目录与材料注入状态；
* subsection prompt 生成；
* Agent Pack 任务包生成；
* Mock subsection_batch 可完成 15/15；
* Local Codex 非交互调用因 `codex exec` 环境超时，不作为当前主线。

当前不把任一试跑稿直接视为正式标书正文。

## 7. 当前阶段限制

当前明确不做：

* 不进入 Production；
* 不进入 Production RC；
* 不更新正式 `skills/knowledge`；
* 不创建正式 Production Skill；
* 不把 `lab_cases/`、`audits/`、`trials/` 直接当作生效规则；
* 不真实调用 OpenAI-Compatible API；
* 不读取或保存真实 API Key；
* 不继续优化 `codex exec`；
* 不做 SkillBundle；
* 不做 Local Access Gate；
* 不做 Cloud API；
* 不做 Word 导出。

## 8. 下一步建议

建议后续路线为：

1. 先完成 Direct Forge / Agent Pack 运行模式收口验收记录；
2. 优先打磨 Agent Pack 当前可用闭环；
3. 再进入 OpenAI-Compatible API Provider 单小节非流式最小闭环；
4. API 单小节稳定后，再做 subsection_batch API 批量生成；
5. 最后再考虑 SkillBundle、Local Access Gate、Word 导出或 Production RC。

## 9. 当前结论

当前 BIDFORGE 已具备本地 AI 标书工作台 MVP 的基础底座：

```text
前台工作台
Local Runner
Provider Adapter
Skill Loader
promptBuilder
generation_trace
Agent Pack
Runner Status
Markdown 预览与下载
```

当前最可用的闭环是 Agent Pack。Direct Forge 是后续稳定自动生成主线，但尚未接入真实 OpenAI-Compatible API。

当前仍处于 MVP / Candidate Skill 验证阶段，不进入 Production，不进入 Production RC。
