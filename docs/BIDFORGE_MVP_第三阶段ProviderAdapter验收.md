# BIDFORGE MVP 第三阶段 Provider Adapter 验收

## 1. 阶段目标

本阶段目标为：

```text
前端选择 provider
→ POST /api/runs 时传入 provider
→ 后端 providerRegistry 分发
→ mockProvider 正常生成
→ codexProvider / openaiProvider 作为占位
→ run 文件记录 provider 信息
```

## 2. 已完成能力

本阶段已完成以下能力：

* 新增 Provider Adapter 层；
* 支持 `mock`、`codex`、`openai`；
* 默认 provider 为 `mock`；
* `mockProvider` 可用；
* `codexProvider` 为占位；
* `openaiProvider` 为占位；
* 前端可选择 provider；
* run 输出记录 provider；
* Codex / OpenAI 未接入时有清晰错误提示；
* 不静默 fallback；
* `npm run build` 通过。

人工验收已确认：

* Mock Provider 可正常生成；
* 前台可预览 Markdown；
* 前台可下载 Markdown；
* run 目录可正常生成；
* `task.json` 已记录 `provider: mock`；
* Codex Provider 显示“暂未接入”，不会假装成功；
* OpenAI Provider 显示“暂未接入”，不会假装成功；
* 页面没有崩溃；
* `npm run build` 已通过。

## 3. 新增与修改文件

新增文件：

```text
server/providers/providerRegistry.js
server/providers/mockProvider.js
server/providers/codexProvider.js
server/providers/openaiProvider.js
```

文件作用：

* `server/providers/providerRegistry.js`：统一注册并分发 provider，支持 `mock`、`codex`、`openai`，默认使用 `mock`。
* `server/providers/mockProvider.js`：当前可用的 mock 生成 provider，返回 Markdown、provider 信息、模型名和 usage 占位数据。
* `server/providers/codexProvider.js`：Codex Provider 占位实现，明确返回暂未接入提示。
* `server/providers/openaiProvider.js`：OpenAI Provider 占位实现，明确返回暂未接入提示。

修改文件：

```text
server/index.js
server/services/mockRunner.js
src/types/runner.ts
src/services/runnerApi.ts
src/App.tsx
src/components/DraftEditor.tsx
src/index.css
```

文件作用：

* `server/index.js`：接收 `/api/runs` 请求中的 provider，并返回 Provider Adapter 相关错误信息。
* `server/services/mockRunner.js`：由单一 mock runner 调整为 run 创建与 provider 调度服务，负责写入 task、prompt、draft、auditor 文件。
* `src/types/runner.ts`：补充 provider、providerName、modelName、usage 等类型字段。
* `src/services/runnerApi.ts`：前端请求中传递 provider，并避免 Codex/OpenAI 被静默 fallback。
* `src/App.tsx`：维护当前选中的 provider，并在生成请求中传入。
* `src/components/DraftEditor.tsx`：增加“生成方式：Mock / Codex / OpenAI”选择入口，并展示 provider 信息。
* `src/index.css`：补充 provider 选择控件样式。

## 4. 当前仍未接入内容

当前明确未接入以下内容：

* 不接真实 Codex；
* 不接真实 OpenAI API；
* 不接 API Key；
* 不做流式输出；
* 不解析 PDF/DOCX；
* 不加载真实 Candidate Skill 全文；
* 不做 Word 导出；
* 不进入 Production；
* 不进入 Production RC。

## 5. 阶段意义

本阶段完成后，Runner 已从单一 mock 生成器升级为可切换 Provider 的任务调度结构。

前端不再与具体模型绑定，而是通过 provider 参数表达生成来源。后续接入 Codex、OpenAI、Claude、DeepSeek、本地模型时，可以通过新增 Provider 的方式扩展，不需要重写前台生成流程。

同时，顶部菜单中的“API 接口”“本地 Runner”已经具备展示基础：Provider Adapter 已完成，Runner 已能落盘，后续可以围绕接口状态、Runner 状态、provider 配置和运行记录做可视化入口。

## 6. 下一步建议

推荐下一步：

```text
调整顶部菜单结构，并为 API 接口 / 本地 Runner / 设置创建静态入口或基础面板。
```

原因：

* Provider Adapter 已完成，API 接口不再是空概念；
* Runner 已能落盘，本地 Runner 可以展示状态；
* 菜单调整属于用户可见进度；
* 暂时不直接接真实 Codex，避免过早进入复杂集成。
