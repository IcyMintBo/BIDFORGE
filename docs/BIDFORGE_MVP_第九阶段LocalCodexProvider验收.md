# BIDFORGE MVP 第九阶段 Local Codex Provider 验收

## 1. 阶段目标

本阶段目标为：

```text
前端选择 Local Codex Provider
→ POST /api/runs
→ Runner 创建 run 目录
→ Skill Loader 读取 Candidate Skill
→ promptBuilder 生成 prompt.md
→ codexProvider 调用本机 Codex CLI
→ Codex 非流式执行 prompt
→ 输出写入 draft.md
→ task.json / auditor_result.md 记录调用结果
```

本阶段只接入 Local Codex Provider 非流式 MVP，不接 OpenAI API，不接 Cloud API，不做流式输出，不进入 Production，不进入 Production RC。

## 2. 已完成能力

* Local Codex Provider 已接入；
* 可调用本机 Codex CLI；
* 支持非流式执行；
* 支持通过 stdin 写入 prompt；
* 支持等待 Codex 进程结束后一次性返回；
* Windows 下兼容 `cmd.exe /d /s /c codex ...`；
* 成功时将 stdout 写入 `draft.md`；
* 失败或超时时写入失败说明；
* 不把 stderr 当正文；
* `task.json` 可记录 providerRawMeta；
* `auditor_result.md` 可记录调用结果；
* 可记录 exitCode、timedOut、stdoutLength、stderrPreview；
* 失败时不 fallback 到 Mock；
* Mock Provider 保持可用；
* promptBuilder 已支持 provider 动态 Task Instruction；
* `prompt.md` 中 mockProvider 旧文案已修复；
* skill manifest 已支持真实 AI 状态动态记录；
* Local Codex 成功时可记录“当前已接入真实 AI：Local Codex Provider”；
* Local Codex 失败时可记录“当前尝试调用真实 AI：Local Codex Provider，但本次调用失败”；
* `npm run build` 已通过。

## 3. 新增与修改文件

本阶段新增文件：

```text
无
```

本阶段修改文件：

```text
server/providers/codexProvider.js
server/providers/providerRegistry.js
server/providers/openaiProvider.js
server/services/mockRunner.js
server/services/providerConfig.js
server/services/runnerStatus.js
server/index.js
src/types/runner.ts
src/types/runnerStatus.ts
src/components/DraftEditor.tsx
src/components/SystemPanelDialog.tsx
server/services/promptBuilder.js
server/services/skillLoader.js
```

主要文件作用：

* `server/providers/codexProvider.js`：实现 Local Codex Provider 非流式 CLI 调用、stdout/stderr/exitCode/timedOut 捕获和 Windows 兼容启动；
* `server/providers/providerRegistry.js`：统一 Provider 注册与 `codex` / `local_codex` 兼容映射；
* `server/providers/openaiProvider.js`：保持 Local OpenAI API Provider 占位，不接真实 API；
* `server/services/mockRunner.js`：串联 run 创建、promptBuilder、Skill Loader、Provider 调用、文件落盘和失败审计；
* `server/services/providerConfig.js`：修复 Codex CLI 检测方式，并返回 Local Codex 连接状态；
* `server/services/runnerStatus.js`：让 Runner Status 反映 Local Codex Provider 的真实 AI Provider 状态；
* `server/index.js`：失败响应补充 runDir 和文件路径；
* `server/services/promptBuilder.js`：按 Provider 动态生成 Task Instruction；
* `server/services/skillLoader.js`：按 Provider 执行结果动态记录 used_skill_manifest 的真实 AI 状态；
* `src/types/runner.ts`、`src/types/runnerStatus.ts`：同步 Provider 类型；
* `src/components/DraftEditor.tsx`：生成方式支持 Local Codex / Local OpenAI 口径；
* `src/components/SystemPanelDialog.tsx`：Provider 配置中心显示 Local Codex 检测与执行配置。

## 4. 人工验收结论

本阶段已通过人工验收。

人工确认：

* Local Codex Provider 可被选择；
* 本机 Codex CLI 可被 Runner 调用；
* Codex 可非流式执行 prompt；
* `draft.md` 可写入 Codex 输出；
* `task.json` 记录 provider 为 local_codex；
* `task.json` 记录 realAi、exitCode、timedOut、stdoutLength、stderrPreview；
* `auditor_result.md` 记录 Codex 是否接入、Provider 执行状态、exitCode、timedOut；
* `prompt.md` 不再出现错误的 mockProvider 旧文案；
* `used_skill_manifest.md` 与 task / auditor 状态一致；
* 失败路径不 fallback 到 Mock；
* Mock Provider 仍可正常生成；
* 页面未崩溃；
* `npm run build` 通过。

## 5. 当前仍未接入内容

* 不接 OpenAI API；
* 不接真实 API Key；
* 不实现 Cloud API；
* 不做流式输出；
* 不解析 PDF/DOCX；
* 不做 Word 导出；
* 不做 SkillBundle；
* 不做 Local Access Gate；
* 不进入 Production；
* 不进入 Production RC。

## 6. 阶段意义

* BIDFORGE 第一次完成了真实 AI Provider 调用；
* Local Runner 已能通过 Provider Adapter 调用本机 Codex；
* 生成链路从 mock 验证升级为真实本机 AI 生成；
* promptBuilder、Skill Loader、used_skill_manifest、auditor_result 已经能参与真实 Provider 运行；
* 这证明 BIDFORGE Local 的本地 AI 工作台路线可行。

## 7. 下一步建议

推荐下一阶段进入：

```text
第十阶段：Local Codex Provider 稳定性与任务体验优化
```

建议目标：

```text
优化 Local Codex 超时、错误提示、生成中状态、取消任务、最新 run 打开、provider 日志摘要等体验
```

也可以选择：

```text
第十阶段：SkillBundle 结构预留
```

如果优先提升产品可用感，建议先做 Local Codex 稳定性与体验优化。该阶段仍不进入 Production，不进入 Production RC，不接 OpenAI API，不实现 Cloud API。
