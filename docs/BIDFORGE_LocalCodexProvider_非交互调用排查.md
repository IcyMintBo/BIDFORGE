# BIDFORGE Local Codex Provider 非交互调用排查

创建日期：2026-06

## 1. 排查目标

本轮目标是确认：为什么用户在 Codex 交互界面中可以直接输出内容，但 BIDFORGE 通过 `codex exec` 非交互调用时容易超时。

本轮只做实验和记录，不接 OpenAI API，不做 SkillBundle，不做 Local Access Gate，不进入 Production，不进入 Production RC。

## 2. 两种模式不是同一执行逻辑

### 模式 A：交互式 Codex

交互式 Codex 是用户直接在 Codex 界面中输入任务，由当前会话进行交互、分步、继续输出。

特点：

* 有当前交互会话；
* 可以流式显示过程；
* 用户可以继续追问、补充、纠偏；
* 可以在输出不完整时手动继续；
* 与 BIDFORGE Runner 的落盘流程无直接绑定。

### 模式 B：BIDFORGE Local Codex Provider

BIDFORGE Local Codex Provider 通过 Node 后端启动独立进程：

```text
codex exec ...
```

由 stdin 输入 prompt，等待进程最终结束，再把 stdout 或 `--output-last-message` 写入 `draft.md`。

特点：

* 是新的非交互进程；
* 没有人工继续输出；
* 非流式等待最终结果；
* 需要 CLI 自己完成鉴权、联网、模型请求和最终返回；
* 一旦超时，Runner 只能记录失败，不能像交互式界面一样继续追问；
* 当前实现不 fallback 到 Mock。

结论：交互式 Codex 能输出，并不等同于 `codex exec` 非交互调用一定能在同一环境、同一超时窗口内稳定返回。

## 3. 当前 BIDFORGE 调用方式

当前 Local Codex Provider 使用 Windows shell bridge 调用：

```text
cmd.exe /d /s /c codex exec --cd <projectRoot> --sandbox read-only --skip-git-repo-check --color never -
```

本轮实验在该基础上增加：

```text
--output-last-message <outputFile>
```

用于验证最终消息是否能写入文件。

## 4. 实验环境说明

本轮在 Codex 工具沙箱中执行命令。该环境与用户直接使用的 Codex 桌面交互界面不完全相同。

Test 1 的 stderr 显示当前 `codex exec` 进程使用：

```text
codex_home=C:\Users\CodexSandboxOffline\.codex
```

并出现 GitHub / chatgpt.com 连接失败与 sampling stream 重连迹象。这说明当前工具沙箱下的 `codex exec` 非交互进程存在联网或会话环境限制。

曾尝试发起沙箱外 smoke test，但自动权限审批未在时限内完成，因此本轮不能把“用户真实桌面环境中的 codex exec”记录为已完成测试。

## 5. 实验矩阵

### Test 1：极短 smoke prompt

Prompt：

```text
请只输出：
## Codex Smoke Test
Local Codex Provider 已返回。
```

命令参数：

```text
codex exec
--cd I:\CodexProjects\BIDFORGE
--sandbox read-only
--skip-git-repo-check
--color never
--output-last-message I:\CodexProjects\BIDFORGE\runs\local_codex_exec_diagnostics_20260611112803\test1_output_last_message.md
-
```

记录：

| 项目 | 结果 |
| ---- | ---- |
| prompt 字符数 | 51 |
| 是否使用 `--output-last-message` | 是 |
| output file 是否生成 | 否 |
| stdoutLength | 0 |
| exitCode | null |
| timedOut | 是 |
| 用时 | 约 123 秒 |
| 是否返回 Markdown 正文 | 否 |
| 诊断目录 | `runs/local_codex_exec_diagnostics_20260611112803/` |

stderrPreview 摘要：

```text
OpenAI Codex v0.133.0
workdir: I:\CodexProjects\BIDFORGE
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
codex_home=C:\Users\CodexSandboxOffline\.codex
failed to sync curated plugins repo
failed to send remote plugin sync request
stream disconnected - retrying sampling request
```

结论：

Test 1 失败。极短 prompt 也未能在 120 秒内返回，说明当前问题首先不是 BIDFORGE prompt 长度、source_materials 注入或小节拆分问题，而是当前 `codex exec` 非交互运行环境本身未稳定完成一次最小模型调用。

### Test 2：单小节短 prompt

Prompt：

```text
请只输出 Markdown：
## 5.1.1 建筑设计总体思路
围绕项目建筑功能、空间组织和专业协同，写一段 80 字左右的正式标书正文。
```

计划要求：

* 不注入 source_materials；
* 不注入完整目录；
* 不注入 skill 摘要；
* 超时 180 秒。

执行状态：

```text
未继续执行。
```

原因：

Test 1 已经失败。按照本轮判断规则，如果 Test 1 都失败，说明 Codex CLI 非交互调用本身或当前环境存在问题。继续执行更重的 Test 2 只会重复等待超时，不能新增有效定位信息。

### Test 3：单小节 + source_materials 摘要

计划要求：

* 只生成 5.1.1；
* 注入 source_materials 摘要；
* 不注入完整 15 个小节；
* 超时 240 秒。

执行状态：

```text
未继续执行。
```

原因：

Test 1 未通过，尚不能进入 prompt 复杂度对比阶段。

### Test 4：当前 BIDFORGE subsection prompt

计划要求：

* 使用当前 subsectionPromptBuilder 生成的 5.1.1 prompt；
* 超时 240 秒。

执行状态：

```text
未继续执行。
```

已有旁证：

上一阶段 Local Codex subsection run 已使用当前 subsection prompt 测试 5.1.1，结果为 timedOut，未 fallback 到 Mock。

相关 run：

```text
runs/20260611103829007_5.1/
```

该 run 已生成：

```text
task.json
used_skill_manifest.md
prompt.md
generation_trace.md
draft.md
auditor_result.md
subsection_prompts/5.1.1.prompt.md
subsection_drafts/5.1.1.md
```

记录结果：

| 项目 | 结果 |
| ---- | ---- |
| provider | local_codex |
| 小节 | 5.1.1 建筑设计总体思路 |
| subsection prompt 是否生成 | 是 |
| output 是否生成 | 是，失败说明写入 subsection draft |
| stdoutLength | 0 |
| exitCode | null |
| timedOut | 是 |
| 是否 fallback 到 Mock | 否 |

## 6. 判断结论

根据本轮判断规则：

1. 如果 Test 1 都失败，说明 Codex CLI 非交互调用本身或环境有问题。
2. 本轮 Test 1 已失败。
3. 因此当前优先结论是：`codex exec` 在当前工具沙箱 / 非交互环境下未能稳定完成最小调用。

当前不能把问题归因于：

* source_materials 太长；
* 5.1.1–5.1.15 目录太长；
* subsectionPromptBuilder prompt 过重；
* Candidate Skill 摘要过多。

这些仍可能影响后续性能，但在 Test 1 未通过前，它们不是第一优先问题。

## 7. 为什么交互式 Codex 可以输出但 Provider 会超时

可能原因包括：

* 交互式 Codex 与 `codex exec` 使用的运行会话不同；
* 当前工具沙箱中的 `codex exec` 使用 `CodexSandboxOffline` 目录，可能不是用户日常交互界面使用的登录和网络环境；
* `codex exec` 启动时会进行插件 / marketplace / 远端资源同步尝试，当前环境下这些请求失败并引发重试；
* `codex exec` 非流式调用必须等最终消息完成后才返回，不能像交互界面一样边输出边人工接管；
* BIDFORGE Runner 设置了明确超时，超时后必须杀掉进程并记录失败；
* `--output-last-message` 只能在 Codex 进程成功产生最终消息后写入，不能解决 CLI 本身未完成调用的问题。

## 8. 建议

### 是否继续使用 `codex exec` 作为自动 Provider

可以继续保留，但建议定位为高级 / 本机增强模式，而不是当前 MVP 的唯一真实 AI Provider。

原因：

* `codex exec` 非交互链路对本机 CLI、登录、网络、CLI 版本、沙箱、工作目录都敏感；
* 当前环境下极短 prompt 都会超时；
* 自动化稳定性尚未达到普通用户默认 Provider 的要求。

### 是否需要更轻的 Codex prompt

需要，但应作为第二优先级。

在 Test 1 通过之前，继续压缩 subsection prompt 不会根治当前超时。

后续如果本机真实环境 Test 1、Test 2 可以通过，再继续优化：

* 减少执行包装指令；
* 减少完整目录重复注入；
* source_materials 只注入相关事实；
* 小节 prompt 控制在更短字符数；
* 使用 `--output-last-message` 读取最终消息。

### 是否更适合做“半自动 Codex 模式”

建议考虑。

半自动模式可以是：

```text
BIDFORGE 生成 prompt.md
→ 用户点击复制 / 打开 prompt
→ 用户在 Codex 交互界面执行
→ 用户把结果粘回 BIDFORGE 或导入 draft.md
```

这种模式更贴近 Codex 交互界面的优势，避免 `codex exec` 非交互超时阻塞整个 Runner。

### 是否暂时保留 Codex Provider 为高级模式

建议保留为高级模式。

当前 UI 和 Provider Adapter 已经支持 Local Codex Provider，但应在配置中心明确：

```text
Local Codex Provider 为本机高级模式，依赖当前电脑 Codex CLI 的非交互执行能力。
```

### 下一步建议

建议下一步先做：

```text
Local Codex Provider 运行环境检测增强
```

具体包括：

1. 增加 `codex exec` smoke test 接口；
2. 检测 `--output-last-message` 是否可成功写入；
3. 在 Provider 配置中心显示 smoke test 结果；
4. 区分“Codex CLI 已安装”和“Codex exec 可非交互生成”；
5. 若 smoke test 不通过，提示使用 Mock 或半自动 Codex 模式；
6. 暂不把 Local Codex 作为默认 Provider。

当前仍不接 OpenAI API，不进入 Production，不进入 Production RC。
