# BIDFORGE MVP 第七阶段 AI Provider 接入策略评估

## 1. 当前目标

本阶段只做 AI Provider 接入策略评估，不真实接入 AI。

当前不接真实 Codex，不接真实 OpenAI API，不接 API Key，不做流式输出，不解析 PDF/DOCX，不进入 Production，不进入 Production RC。

本阶段评估目标是判断 BIDFORGE 后续如何在不强制依赖某一种本地工具的前提下，稳定扩展真实 AI Provider。

参考信息：

* 当前本机检测到 Codex CLI：`codex-cli 0.133.0`；
* 当前本机 `codex exec --help` 显示支持非交互运行，并支持从参数或 stdin 读取 prompt；
* OpenAI 官方 API 文档显示 Responses API 是当前用于生成模型响应的主要接口之一，支持文本输入输出、工具、状态和 `stream` 参数；
* 参考官方文档：
  * https://platform.openai.com/docs/api-reference/responses
  * https://developers.openai.com/api/docs/guides/text

## 2. 核心结论

明确结论：

* BIDFORGE 不能强制依赖 Codex；
* Codex Provider 应作为可选本地增强模式；
* OpenAI API Provider 更适合作为普通用户通用模式；
* Provider Adapter 是正确方向；
* 前端和 Runner 不应绑定具体 Provider。

原因如下：

* 不同用户环境差异很大，普通用户不一定安装 Codex CLI，也不一定熟悉本地 Agent 工具；
* Codex 适合开发者、本地自动化和高级用户，但不适合作为唯一入口；
* API Provider 更适合分发版本，只要用户配置 API Key 即可使用；
* Provider Adapter 可以让 `mock / codex / openai / claude / deepseek / local` 共用同一套 `task + skillManifest + promptBuilder + runs` 流程；
* 前端只应该关心 provider id、状态、错误提示和输出结果，不应关心某个 provider 的内部调用方式。

## 3. 三种 Provider 模式对比

| 模式 | 是否要求安装 Codex | 是否要求 API Key | 适合用户 | 优点 | 缺点 | 是否建议当前接入 |
| -- | ------------ | ------------ | ---- | -- | -- | -------- |
| Codex CLI Provider | 是 | 取决于 Codex 登录状态，不由 BIDFORGE 直接管理 | 用户本人、高级用户、已安装 Codex CLI 的本地开发场景 | 可利用本地 Agent 能力，适合开发者工作流，可通过本地命令非交互执行 | 用户环境依赖强，安装/登录/权限/超时/工作目录复杂，不适合强制要求 | 不建议作为默认；可后续作为可选增强 |
| OpenAI API Provider | 否 | 是 | 普通用户、不安装 Codex 的用户、未来可分发版本 | 通用性更强，部署和体验更可控，易于记录 usage，适合非流式 MVP | 需要安全保存 API Key，需要处理余额、额度、网络和模型配置 | 建议作为通用真实 AI Provider，但应先做配置面板 |
| 托管服务 Provider | 否 | 用户侧通常不需要 | 未来商业化用户、不想配置 API Key 的用户 | 用户体验最好，可集中管理模型、账号、计费、策略 | 服务器成本、数据安全、账号权限、合规责任更重 | 不进入当前 MVP，属于后期路线 |

## 4. Codex Provider 接入评估

### 本机是否已安装 Codex CLI

当前本机检测结果：

```text
where codex
→ C:\Program Files\WindowsApps\OpenAI.Codex_26.608.1337.0_x64__2p2nqsd0c76g0\app\resources\codex
→ C:\Program Files\WindowsApps\OpenAI.Codex_26.608.1337.0_x64__2p2nqsd0c76g0\app\resources\codex.exe

codex --version
→ codex-cli 0.133.0
```

这只能说明当前开发机可用，不能代表其他用户环境可用。

### 是否支持非交互运行

当前本机 `codex exec --help` 显示：

* `codex exec` 用于非交互运行；
* prompt 可以作为参数传入；
* prompt 也可以通过 stdin 传入；
* 支持 `--cd` 指定工作目录；
* 支持 `--output-last-message <FILE>` 输出最终消息；
* 支持 `--json` 输出 JSONL 事件；
* 支持 `--sandbox` 设置沙箱策略。

因此从技术上看，Codex Provider 可以设计为非交互调用：

```text
prompt.md → codex exec - 或 codex exec <prompt> → stdout / output file → draft.md
```

### 如何传入 prompt

建议优先使用 stdin 或临时 prompt 文件：

* Runner 读取当前 run 的 `prompt.md`；
* 通过 stdin 传给 `codex exec -`；
* 或通过命令参数传入较短 prompt；
* 对长 prompt，应避免命令行长度限制，优先 stdin。

### 如何读取 stdout / stderr

建议：

* stdout 用于接收结果或 JSONL 事件；
* stderr 用于记录错误日志；
* 可同时使用 `--output-last-message` 写入临时输出文件；
* Runner 将最终内容写入 `draft.md`；
* 原始 stdout / stderr 可后续写入 `provider_raw.log`，但当前 MVP 不必新增。

### 适合非流式还是流式

建议先做非流式。

原因：

* 当前前端和 run 流程都是一次性返回；
* 当前 promptBuilder 已适合一次性 prompt；
* 非流式更容易处理超时、失败、文件落盘和审计；
* 流式需要新增前端状态、SSE/WebSocket 或轮询，不适合立即推进。

### 未安装时如何提示

如果检测不到 Codex CLI，应显示：

```text
Codex Provider 未连接：未检测到 Codex CLI。请安装并登录 Codex，或切换到 OpenAI API Provider。
```

不应静默 fallback 到 mock 或 OpenAI。

### 失败如何处理

需要处理：

* 命令不存在；
* 未登录或授权失败；
* 非零退出码；
* 超时；
* stdout 为空；
* stderr 有错误；
* 工作目录不存在；
* 权限不足；
* 生成内容不符合 Markdown 预期。

失败结果应写入 `auditor_result.md` 或 provider 错误摘要，并返回前端清晰错误。

### 是否建议作为默认 Provider

不建议。

Codex Provider 应作为可选本地增强模式，适合已安装 Codex CLI 的高级用户，不适合作为普通用户默认模式。

## 5. OpenAI API Provider 接入评估

### 是否适合普通用户

适合。

普通用户不一定安装 Codex，但可以通过配置 OpenAI API Key 使用真实模型。因此 OpenAI API Provider 更适合作为通用接入方式。

### API Key 配置方式

建议：

* 不把 API Key 写入前端代码；
* 不把 API Key 提交到 Git；
* 不通过 URL query 或 localStorage 明文保存；
* 由后端读取本地安全配置；
* 设置面板只显示是否已配置，不显示完整 Key。

可选方案：

```text
.env.local
server/.env.local
系统环境变量 OPENAI_API_KEY
操作系统凭据管理器
后续桌面版安全存储
```

MVP 阶段可以优先使用后端 `.env.local` 或系统环境变量，但必须加入 `.gitignore`。

### 本地保存方式

推荐顺序：

1. 系统环境变量；
2. 后端本地 `.env.local`；
3. 后续桌面版安全存储；
4. 不建议前端保存完整 API Key。

### 安全风险

主要风险：

* Key 泄露到前端 bundle；
* Key 被提交到 Git；
* Key 被写入 run 文件；
* 错误日志泄露 Key；
* 用户共享项目目录时泄露配置。

要求：

* run 目录不得写入完整 API Key；
* 日志不得打印完整 API Key；
* 面板最多显示 `已配置 / 未配置` 或尾号掩码；
* 配置文件必须被 `.gitignore` 忽略。

### 非流式接入方式

建议先做非流式 Responses API：

```text
prompt.md → openai.responses.create({ model, input }) → output_text → draft.md
```

理由：

* 当前 Runner 是一次请求生成一个 run；
* 当前前端不支持 token 级流式显示；
* 非流式更便于审计、落盘和错误处理；
* usage 可以在响应完成后统一记录。

### 后续流式方案

后续可支持：

* Responses API `stream: true`；
* 后端 SSE 转发；
* 前端实时追加 Markdown；
* run 目录增量写入 `draft.md.tmp`；
* 完成后重命名为 `draft.md`；
* 失败时写入 `auditor_result.md`。

但流式不进入当前 MVP。

### usage 记录

OpenAI API Provider 应记录：

```json
{
  "usage": {
    "inputTokens": 0,
    "outputTokens": 0,
    "totalTokens": 0
  }
}
```

并写入：

* `task.json`；
* `auditor_result.md`；
* Provider raw meta 摘要；
* Runner Status 可选摘要。

### 与 promptBuilder / runs 的关系

OpenAI API Provider 不应自己拼 prompt。

建议链路：

```text
task input
→ Skill Loader
→ used_skill_manifest.md
→ promptBuilder
→ prompt.md
→ OpenAI API Provider 读取 promptMarkdown
→ draft.md
→ task.json / auditor_result.md 记录 provider 与 usage
```

### 是否建议优先接入

OpenAI API Provider 更适合作为通用真实 AI Provider，但不建议马上直接接。

更合理的顺序是：

1. 先做 Provider 配置面板；
2. 再做 OpenAI API Provider 非流式最小接入；
3. 再考虑 Codex Provider；
4. 最后再考虑流式、托管服务和更多模型。

## 6. Provider 配置面板建议

建议将顶部 `API 接口` 面板升级为 Provider 配置中心。

应包含：

### Provider 列表

显示：

* Mock Provider；
* Codex Provider；
* OpenAI Provider；
* 后续 Claude / DeepSeek / Local Model。

### Provider 状态

显示：

* available；
* placeholder；
* not_configured；
* unavailable；
* error。

### API Key 配置

OpenAI API Key 应只在后端保存。

前端设置面板可提供：

* 输入 API Key；
* 保存到后端本地配置；
* 显示已配置 / 未配置；
* 不显示完整 Key。

### Codex 是否已安装检测

Codex Provider 可提供检测按钮：

```text
检测 Codex CLI
```

后端执行只读检测：

```text
codex --version
codex exec --help
```

检测结果只用于状态展示，不触发生成。

### 默认 Provider 选择

允许用户选择：

* Mock；
* OpenAI；
* Codex；
* 后续 Claude / DeepSeek / Local。

默认建议：

* 开发期默认 Mock；
* 普通用户配置 Key 后可设为 OpenAI；
* Codex 仅在检测可用后允许选择。

### 测试连接按钮

每个 Provider 可提供：

```text
测试连接
```

但测试连接必须遵守：

* Mock 不调用外部服务；
* Codex 只检测 CLI，不生成；
* OpenAI 可以只做轻量模型列表或最小测试请求；
* 测试失败必须显示清晰原因。

### 不同 Provider 的错误提示

错误提示应明确：

* Codex 未安装；
* Codex 未登录；
* OpenAI API Key 未配置；
* OpenAI API Key 无效；
* 网络失败；
* 配额或余额不足；
* 超时；
* Provider 暂未接入。

禁止静默 fallback。

## 7. 推荐当前下一步

推荐选择：

```text
C. 先做 Provider 配置面板
```

理由：

* BIDFORGE 不能强制依赖 Codex；
* OpenAI API Provider 虽然更适合普通用户，但需要 API Key 配置、安全保存、状态展示和错误提示；
* Codex Provider 也需要安装检测、登录检测、工作目录和超时策略；
* 直接接某个真实 Provider 会把配置、安全和错误处理问题一起引入；
* Provider 配置面板完成后，再接 OpenAI API Provider 或 Codex Provider 都更稳；
* 配置面板属于用户可见进度，也能延续当前 Runner Status 的可观测路线。

不建议当前直接选 A 或 B：

* 先接 Codex Provider 容易让系统被本机 Codex 绑定，不适合未来普通用户；
* 先接 OpenAI API Provider 会立刻遇到 API Key 保存和安全问题，缺少配置面板会很别扭；
* 继续只完善 Runner Status 的收益低于补齐 Provider 配置入口。

推荐顺序：

```text
第八阶段：Provider 配置面板
→ 第九阶段：OpenAI API Provider 非流式最小接入
→ 第十阶段：Codex Provider 可选接入
→ 后续：Claude / DeepSeek / 本地模型 / 托管服务
```

## 8. MVP 安全边界

必须明确以下边界：

* 不进入 Production；
* 不进入 Production RC；
* 不把 API Key 写入前端代码；
* 不把用户 API Key 提交到 Git；
* 不强制用户安装 Codex；
* 不静默 fallback 到其他 Provider；
* 不把 mock 结果伪装成真实 AI；
* 不在 run 文件中记录完整 API Key；
* 不在错误日志中打印完整 API Key；
* 不让 Provider 直接绕过 promptBuilder；
* 不让前端绑定具体 Provider 的执行细节。
