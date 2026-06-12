# BIDFORGE MVP Direct Forge / Agent Pack 运行模式收口验收

## 1. 阶段目标

本阶段目标是把前台运行方式从工程内部模式收口为两个用户可理解的产品入口：

```text
Direct Forge
Agent Pack
```

内部工程模式仍保留：

```text
mock_run
dry_run
api_run
codex_workspace
```

但普通前台不再并列展示这些技术模式，避免用户在“Mock / Dry Run / API Run / Codex Workspace”之间理解成本过高。

## 2. 当前前台表达

当前主编辑区工具栏中只保留一个紧凑的模式下拉菜单：

```text
Direct Forge
Agent Pack
```

已移除前台大面积模式卡片和备注说明，避免占用草稿正文区域。

### Direct Forge

中文定位：直接生成。

产品含义：

```text
在 BIDFORGE 内部调用 API Provider，直接生成标书正文。
```

当前状态：

* 前台可选择 Direct Forge；
* 点击生成前有真实 API 调用确认弹窗；
* 后端映射为 `api_run`；
* 当前仍不真实调用 API；
* 当前记录 `apiCalled=false`；
* 当前生成 API Run 准备包和上下文，不消耗 API。

### Agent Pack

中文定位：任务包。

产品含义：

```text
BIDFORGE 生成完整任务包，交给 Codex、Claude Code、龙虾、Cursor 等外部 Agent 执行，完成后回到 BIDFORGE 读取结果。
```

当前状态：

* 前台可选择 Agent Pack；
* 后端映射为 `codex_workspace`；
* 不调用真实 API；
* 不调用 `codex exec`；
* 可生成任务包文件；
* 可复制 Agent 指令；
* 可读取 `draft.md` 回填结果。

## 3. 前后台映射

| 前台模式 | displayMode | 后端 runMode | Provider 口径 | 当前是否调用真实 AI | 当前用途 |
| ---- | ---- | ---- | ---- | ---- | ---- |
| Direct Forge | `direct_forge` | `api_run` | `openai_compatible` | 否 | API 自动生成准备分支 |
| Agent Pack | `agent_pack` | `codex_workspace` | `codex_workspace` | 否 | 生成外部 Agent 任务包 |
| Mock 调试 | 无普通入口 | `mock_run` | `mock` | 否 | 开发调试、流程验证 |

说明：

* Mock 后端能力保留，但不作为普通前台主入口展示；
* `dry_run` 暂作为内部能力保留；
* 当前不删除旧内部模式，避免破坏 Runner 和测试链路；
* 前台产品表达优先使用 Direct Forge / Agent Pack。

## 4. 已完成能力

本阶段已完成：

* 前台运行方式收口为 Direct Forge / Agent Pack；
* 主编辑区不再展示 Mock / Dry Run / API Run / Codex Workspace 四个技术模式；
* 模式选择从大卡片改为工具栏下拉菜单；
* Direct Forge 点击生成前弹出真实 API 调用确认；
* Direct Forge 当前仅生成 API Run 准备上下文；
* Direct Forge 当前记录 `apiCalled=false`；
* Agent Pack 可生成任务包；
* Agent Pack 可生成 `codex_instructions.md`；
* Agent Pack 指令包含本机绝对路径和项目内相对路径；
* Agent Pack 支持复制 Agent 指令；
* Agent Pack 支持读取 `draft.md` 回填结果；
* `task.json` / `generation_trace.md` / `auditor_result.md` 可记录 `displayMode`；
* Mock Provider 后端调试能力保留；
* `npm run build` 已通过。

## 5. Agent Pack 当前文件结构

Agent Pack run 目录当前可包含：

```text
task.json
used_skill_manifest.md
prompt.md
generation_trace.md
draft.md
auditor_result.md
codex_instructions.md
subsection_prompts/
```

其中：

* `codex_instructions.md` 是外部 Agent 执行说明；
* `subsection_prompts/` 用于逐小节任务包；
* `draft.md` 是外部 Agent 完成后回填给 BIDFORGE 的结果文件；
* `generation_trace.md` 用于解释本次生成注入了哪些目录、材料和规则摘要。

## 6. 当前仍未接入内容

当前明确未接入：

* 不真实调用 OpenAI-Compatible API；
* 不读取或保存真实 API Key；
* 不实现 Cloud API；
* 不继续优化 `codex exec`；
* 不做内嵌终端；
* 不做 SkillBundle；
* 不做 Local Access Gate；
* 不做 Word 导出；
* 不进入 Production；
* 不进入 Production RC。

## 7. 当前意义

本阶段完成后，BIDFORGE 的前台表达从“工程调试模式集合”收口为“用户能理解的两条路径”：

```text
Direct Forge：以后用于自动 API 生成。
Agent Pack：当前用于本地任务包与外部 Agent 协作。
```

这让后续开发可以分成两条清晰主线：

* 产品主线：Direct Forge 接 OpenAI-Compatible API；
* 调试/协作主线：Agent Pack 继续优化任务包和结果回填体验。

## 8. 下一步建议

建议下一阶段优先进入：

```text
OpenAI-Compatible API Provider 单小节非流式最小闭环
```

建议范围：

* 只接本地环境变量中的 API Key；
* 不把 API Key 写入前端、run 文件或日志；
* 非流式；
* 先只生成 `5.1.1` 单小节；
* 真实调用前二次确认；
* 写入 `draft.md`；
* 记录 usage / apiCalled / model / providerRawMeta；
* 不进入 Production / Production RC。

如果希望继续降低风险，也可以先做 Agent Pack 体验优化：

* 任务包文件清单展示；
* 读取结果状态优化；
* subsection_drafts 检测与合并提示；
* Agent 指令文案压缩。
