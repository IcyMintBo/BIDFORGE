# BIDFORGE 扩写流程角色分离方案

## 1. 背景

Case 007 的扩写流程暴露出以下问题：

1. `revised_expanded_draft.md` 中出现了明显写作指导语外露，例如：
   - 本节扩写重点……
   - 扩写时应……
   - 这样可以增加正文厚度……
   - 这里可以使用……
   - 更不能承诺……

2. `final_revised_expanded_draft.md` 虽然清理了部分显性指导语，但仍存在规则语言正文化不足，例如：
   - 需要落实到……
   - 应重点关注……
   - 不宜直接……
   - 可以按照……组织……
   - 避免停留在……

3. 这些问题说明：扩写正文不能只依靠同一上下文的机器自审。Writer、Reviewer 和 Auditor 如果都在同一上下文中，容易自我合理化和漏检。

因此，后续扩写流程必须引入角色分离机制。该机制的目标不是增加形式，而是防止“自己写、自己审、自己说通过”，并防止写作指导语、规则语言、审查语言进入正式正文。

## 2. 方案目标

本方案用于定义 BIDFORGE 后续扩写流程中：

- 谁负责生成正文；
- 谁负责审查正文；
- 谁负责根据审查意见修改；
- 谁负责判断规则是否晋级；
- 如何避免同一角色自写自审；
- 如何防止写作指导语、规则语言、审查语言进入正式正文；
- 如何把 Case 007 暴露的问题固化为流程约束。

本方案不生成标书正文，不更新正式 `skills/knowledge`，不进入 Production，不进入 Production RC。

## 3. 四个角色定义

### 3.1 Writer

#### 职责

- 根据精简稿、扩写大纲和 Candidate Skill 生成正文；
- 只负责写正文；
- 不负责判断正文是否合格；
- 不得在正文中暴露写作策略、扩写要求、规则说明或审查语言。

#### 禁止

- 不得写“本节扩写重点……”；
- 不得写“扩写时应……”；
- 不得写“这样可以增加正文厚度……”；
- 不得写“这里可以使用……”；
- 不得把规则提示原样写进正文；
- 不得把审查意见写进正文；
- 不得自行宣布正文通过审查；
- 不得为了扩写而新增无依据事实。

#### 输出

```text
expanded_draft.md
```

### 3.2 Reviewer

#### 职责

- 只负责审查 Writer 输出；
- 不负责重写正文；
- 必须以挑错为目标，而不是证明正文合格；
- 必须检查正文是否像正式投标文件正文。

#### 重点检查

- 写作指导语外露；
- 规则语言正文化不足；
- 注水；
- 重复；
- 无依据事实；
- 过度承诺；
- 服务范围扩大；
- 分析框架显性化；
- 总结收束重复；
- 正式标书口吻不足。

#### 输出

```text
review_expanded_draft.md
formalization_check.md
```

### 3.3 Rewriter

#### 职责

- 只根据 Reviewer 的审查报告修改正文；
- 不重新发明结构；
- 不新增无来源事实；
- 不擅自扩大服务范围；
- 不把审查语言带入正文；
- 重点完成“正文化转换”。

#### 修改边界

Rewriter 只能处理 Reviewer 已指出的问题，包括：

- 删除或转化写作指导语；
- 将规则语言转化为正式正文；
- 删除重复和注水；
- 修正过度承诺；
- 收紧服务边界；
- 优化正式标书口吻。

#### 输出

```text
revised_expanded_draft.md
final_revised_expanded_draft.md
```

### 3.4 Auditor

#### 职责

- 不写正文；
- 不改正文；
- 只判断流程是否通过；
- 判断规则是否可以进入 Candidate / RC / Production；
- 判断本轮 Case 是否通过；
- 判断是否需要人工复核；
- 判断是否需要新增观察项或候选规则。

#### 重点检查

- Writer 是否真正使用了指定 Candidate Skill；
- Reviewer 是否独立审查；
- Rewriter 是否只按审查意见修改；
- final 正文是否通过 `formalization_check`；
- 是否存在自审漏检；
- 是否可以进入下一阶段。

#### 输出

```text
auditor_result.md
```

## 4. 新扩写流程图

```text
source_compact_section.md
→ expansion_outline.md
→ Writer: expanded_draft.md
→ Reviewer: review_expanded_draft.md
→ Reviewer: formalization_check.md
→ Rewriter: revised_expanded_draft.md
→ Reviewer: final_formalization_check.md
→ Auditor: auditor_result.md
→ Human Review: human_edit.md（可选但优先级最高）
→ Diff Learning: diff_learning.md
```

## 5. 文件流转表

| 步骤 | 角色 | 输入 | 输出 | 作用 | 通过标准 |
|---|---|---|---|---|---|
| 1 | 系统 / 人工 | 当前项目资料、精简稿 | `source_compact_section.md` | 固定扩写来源 | 来源明确，不混入外项目内容 |
| 2 | 系统 / Writer 准备 | `source_compact_section.md`、Candidate Skill | `expansion_outline.md` | 生成扩写结构 | 子节来自原文逻辑，不为凑字数拆分 |
| 3 | Writer | 精简稿、大纲、Candidate Skill | `expanded_draft.md` | 生成扩写正文 | 不自评通过，不写指导语，不新增无依据事实 |
| 4 | Reviewer | `expanded_draft.md`、规则清单 | `review_expanded_draft.md` | 审查正文质量和风险 | 必须列出问题或明确无问题依据 |
| 5 | Reviewer | `expanded_draft.md`、正文化清单 | `formalization_check.md` | 专项检查正文化 | 无写作指导语外露，无规则语言正文化不足 |
| 6 | Rewriter | `expanded_draft.md`、审查报告 | `revised_expanded_draft.md` | 根据审查意见修改 | 只修审查问题，不重新发明结构 |
| 7 | Reviewer | `revised_expanded_draft.md` | `final_formalization_check.md` | 复核正文化转换 | 通过后才允许进入 Auditor |
| 8 | Auditor | 全部输入、输出、审查报告 | `auditor_result.md` | 判断 Case 和规则状态 | 未通过正文化检查不得进入 RC 判断 |
| 9 | Human Review | final 正文和审查文件 | `human_edit.md` | 人工复核和最终样本 | 人工结论优先级最高 |
| 10 | 系统 / Auditor | 机器稿、人工稿、审查记录 | `diff_learning.md` | 沉淀规则差异 | 明确观察项、候选规则和禁止进入项 |

## 6. used_skill_manifest 机制

后续每个 Case 都必须创建：

```text
used_skill_manifest.md
```

该文件用于记录：

- 本轮使用的 Candidate Skill 版本；
- 实际读取的文件；
- 启用的规则；
- 慎用的规则；
- 观察项；
- 禁止误用；
- 本轮规则应用计划。

重要约束：

如果没有实际读取 Candidate Skill 文件，不得声称使用了 Candidate Skill。

建议字段：

| 字段 | 要求 |
|---|---|
| 使用的 Candidate Skill 版本 | 写明具体目录 |
| 实际读取的文件 | 只列真实读取过的文件 |
| 启用规则 | 写明规则名称和启用理由 |
| 慎用规则 | 写明慎用原因和边界 |
| 观察项 | 写明观察目标 |
| 禁止误用 | 明确不得写入正文的内容 |
| 规则应用计划 | 说明生成、审查和修正时如何使用规则 |

## 7. formalization_check 固定化

Case 007 中的 `expansion_formalization_checklist.md` 应固化为扩写流程中的必需检查步骤。

`formalization_check` 必须检查：

1. 写作指导语外露；
2. 规则语言正文化不足；
3. 注水和重复；
4. 总结收束重复；
5. 分析框架显性化；
6. 服务范围扩大；
7. 过度承诺；
8. 无依据事实；
9. 正式标书口吻不足。

只有通过 `formalization_check` 的正文，才能进入 Auditor 判断。未通过正文化检查的正文，即使大纲合理、没有无依据事实、没有过度承诺，也不得进入 Production RC 判断。

## 8. Human Review 优先级

人工复核优先级高于机器自审。

如果人工指出明显问题，必须回写到：

- `diff_learning.md`
- `auditor_result.md`
- 阶段性审计文件

流程约束：

- 机器自审通过不代表 Case 通过；
- 同上下文审查只能作为初审，不能作为最终审计依据；
- 人工复核指出的问题必须成为后续观察项、候选规则或流程约束；
- 若人工稿明显优于机器稿，应以 `human_edit.md` 作为本轮确认样本。

## 9. 两阶段落地建议

### 9.1 第一阶段：当前手动流程

当前阶段仍然可以由 Codex 在同一会话中执行，但必须在文件中模拟 Writer / Reviewer / Rewriter / Auditor 的角色边界。

要求：

- 每一步输出独立文件；
- 不允许 Writer 自己声明通过；
- Reviewer 必须以挑错为目标；
- Rewriter 只能根据审查报告修改；
- Auditor 必须记录自审风险；
- Human Review 优先级高于机器自审；
- 未通过 `formalization_check` 前，不得进入下一阶段判断。

### 9.2 第二阶段：后续产品化流程

后续产品化时，Writer、Reviewer、Auditor 尽量使用独立上下文或独立任务。

建议：

- Writer 只读取精简稿、大纲和写作规则；
- Reviewer 只读取正文和审查规则，不读取 Writer 的过程解释；
- Rewriter 只读取正文和 Reviewer 报告；
- Auditor 只读取最终文件、审查报告、人工反馈和规则来源；
- Production RC 前必须至少进行一次独立 Reviewer / Auditor 审查。

## 10. Case 007 暴露的问题总结

Case 007 暴露的问题不是“不能拆大纲”，而是“扩写正文未能稳定通过正文化转换”。

具体包括：

- 扩写大纲基本合理；
- 局部扩写有内容增量；
- 机器修正版混入写作指导语；
- final 版仍有规则语言正文化不足；
- 同上下文自审漏检；
- 人工复核比机器自审更准确；
- `human_edit.md` 证明正文化转换方向成立；
- Case 007 暂缓通过。

## 11. 四个角色职责表

| 角色 | 做什么 | 不做什么 | 核心输出 |
|---|---|---|---|
| Writer | 生成正式正文 | 不判断是否合格，不写规则说明 | `expanded_draft.md` |
| Reviewer | 审查正文并挑错 | 不重写正文，不替 Writer 辩护 | `review_expanded_draft.md`、`formalization_check.md` |
| Rewriter | 按审查意见修正文稿 | 不重新发明结构，不新增事实 | `revised_expanded_draft.md`、`final_revised_expanded_draft.md` |
| Auditor | 判断流程、规则和阶段状态 | 不写正文，不改正文 | `auditor_result.md` |

## 12. 每一步通过标准

| 步骤 | 通过标准 |
|---|---|
| source_compact_section | 来源清楚，不混项目，不含无依据事实 |
| expansion_outline | 子节来自原文逻辑，不重复拆分，不为凑字数扩展 |
| expanded_draft | 有信息增量，无写作过程语言，无无依据事实 |
| review_expanded_draft | 审查完整，重点检查风险和正文口吻 |
| formalization_check | 无写作指导语外露，无规则语言正文化不足 |
| revised_expanded_draft | 只按审查报告修改，不重新发明结构 |
| final_formalization_check | 正文像正式标书，不像写作说明或审查报告 |
| auditor_result | 明确是否通过、是否进入下一阶段、是否需人工复核 |
| human_edit | 人工复核优先，作为差异学习依据 |
| diff_learning | 记录问题本质、人工改法和后续规则启示 |

## 13. 当前阶段结论

| 问题 | 结论 |
|---|---|
| Case 007 是否需要重跑 | 暂缓，先补强流程 |
| 是否可以进入 Case 008 | 否 |
| 是否进入 Production | 否 |
| 是否进入 Production RC | 否 |
| 是否更新正式 `skills/knowledge` | 否 |
| 是否创建新的 Candidate Skill | 否 |
| 下一步 | 先补强扩写流程角色分离机制，再决定是否重跑 Case 007 或进入 Case 008 |

## 14. 最终建议

- Case 007 暂缓通过；
- 暂不进入 Case 008；
- 暂不进入 Production；
- 暂不进入 Production RC；
- 先补强扩写流程角色分离机制；
- 后续再决定是否重跑 Case 007 或进入 Case 008；
- `formalization_check` 应成为后续扩写流程固定步骤；
- Production RC 前必须至少经过一次独立 Reviewer / Auditor 审查。

