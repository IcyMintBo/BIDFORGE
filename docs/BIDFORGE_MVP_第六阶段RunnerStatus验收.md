# BIDFORGE MVP 第六阶段 Runner Status 验收

## 1. 阶段目标

本阶段目标为：

```text
点击“本地 Runner”
→ 前端请求只读状态接口
→ 显示 Runner 是否在线
→ 显示当前支持的 Provider
→ 显示最新 run 目录
→ 显示最新 run 文件列表
→ 显示当前仍未接真实 AI / 未进入 Production / RC
```

本阶段只做本地 Runner 状态读取和前台展示，不触发生成任务，不接真实 AI，不进入 Production / Production RC。

## 2. 已完成能力

本阶段已完成以下能力：

* 新增 `/api/runner/status`；
* 支持 latest run 读取；
* 支持 Provider 状态读取；
* 本地 Runner 面板可展示在线 / 未连接状态；
* 本地 Runner 面板可展示地址、Health 接口、Status 接口；
* 本地 Runner 面板可展示 Provider 状态；
* 本地 Runner 面板可展示 latest run 和文件列表；
* 后端未连接时显示明确错误提示；
* `npm run build` 通过。

## 3. 新增与修改文件

新增文件：

```text
server/services/runnerStatus.js
src/services/runnerStatusApi.ts
src/types/runnerStatus.ts
```

文件作用：

* `server/services/runnerStatus.js`：后端只读状态服务，读取 Provider 状态、扫描 `runs/` 并返回 latest run 基本信息。
* `src/services/runnerStatusApi.ts`：前端 Runner 状态查询 API，负责请求 `GET /api/runner/status`。
* `src/types/runnerStatus.ts`：定义 RunnerStatus、ProviderStatus、LatestRunSummary 等前端类型。

修改文件：

```text
server/index.js
src/components/SystemPanelDialog.tsx
src/index.css
```

文件作用：

* `server/index.js`：新增 `GET /api/runner/status` 路由，保留 `/api/health` 与 `/api/runs`。
* `src/components/SystemPanelDialog.tsx`：将“本地 Runner”面板从静态说明升级为只读状态展示，支持在线、未连接、Provider、latest run、文件列表和阶段边界展示。
* `src/index.css`：补充 Runner 状态面板、错误提示和文件列表样式。

## 4. 人工验收结论

本阶段已通过人工验收。

人工确认：

* 启动 `npm run server` 后，本地 Runner 面板显示在线；
* 面板显示 `http://localhost:8787`；
* 面板显示 Provider 状态；
* 面板显示 latest run；
* 面板显示 latest run 文件列表；
* 关闭后端后，前端显示“本地 Runner 未连接，请确认已运行 npm run server。”；
* 页面未崩溃。

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

本阶段完成后，BIDFORGE 已具备本地 Runner 可观测能力。

用户可以在前台确认 Runner 是否在线，可以查看当前支持的 Provider，可以查看最新 run 目录和文件落盘情况。这样在后续接真实 Codex Provider 前，系统已经具备基本排错入口。

至此，在接 AI 前，BIDFORGE 已经具备以下底座：

* Provider Adapter；
* Skill Manifest；
* promptBuilder；
* Runner Status。

这些能力共同降低了后续真实生成时的排错成本，也降低了误把 mock 结果当作真实 AI 结果、误读旧规则、误进入 Production / RC 的风险。

## 7. 下一步建议

推荐下一阶段进入：

```text
第七阶段：Codex Provider 接入方案评估
```

本阶段只做评估，不直接接入。

评估内容包括：

* Codex 是通过 CLI、Codex App，还是其他本地接口调用；
* 是否支持非交互运行；
* 如何传入 `prompt.md`；
* 如何接收 stdout / 文件输出；
* 如何写入 `runs/`；
* 是否先做非流式；
* 后续是否支持流式；
* 如何处理失败、超时、权限和工作目录。
