# BIDFORGE Candidate Skill 状态说明

## 1. 读取依据

本说明基于以下已读取文件整理：

- `candidate_skills/bidforge-writing-candidate-v0.3/README.md`
- `candidate_skills/bidforge-writing-candidate-v0.3/rules.md`
- `candidate_skills/bidforge-writing-candidate-v0.3/auditor_notes.md`
- `candidate_skills/bidforge-expansion-candidate-v0.2/README.md`
- `candidate_skills/bidforge-expansion-candidate-v0.2/rules.md`
- `candidate_skills/bidforge-expansion-candidate-v0.2/auditor_notes.md`
- `docs/BIDFORGE_写作扩写工作流确认.md`
- `audits/expansion_candidate_v0.2_stage_audit.md`
- `audits/case_011_human_feedback_audit.md`

以下文件未读取成功，因为项目中未找到该路径：

```text
docs/BIDFORGE_当前阶段状态与下一步路线.md
```

本文件不依据缺失文件补写状态，不进入 Production，不进入 Production RC，不更新正式 `skills/knowledge`。

## 2. 当前是否已经形成 Skill

当前 BIDFORGE 已经形成的是 Candidate Skill，不是正式 Production Skill。

| 类型 | 当前状态 | 说明 |
| --- | --- | --- |
| Candidate Skill | 已形成 | 当前用于候选区测试和规则验证。 |
| Production Skill | 未形成 | 尚未进入正式生产能力。 |
| Production RC Skill | 未形成 | 尚未进入 Production RC。 |
| 正式 `skills/knowledge` | 未更新 | 当前规则仍保留在 `candidate_skills/` 与审计文件中。 |

当前所有规则和流程结论仍应理解为候选能力，不应直接接入前台、正式知识库或正式 Skill。

## 3. 当前 Candidate Skill 列表

当前有效候选 Skill 主要包括：

```text
candidate_skills/bidforge-writing-candidate-v0.3/
candidate_skills/bidforge-expansion-candidate-v0.2/
```

项目目录中还存在历史候选版本：

```text
candidate_skills/bidforge-writing-candidate-v0.1/
candidate_skills/bidforge-writing-candidate-v0.2/
candidate_skills/bidforge-expansion-candidate-v0.1/
```

这些历史版本作为阶段记录保留；当前试跑应优先使用 Writing Candidate v0.3 和 Expansion Candidate v0.2。

## 4. Writing Candidate v0.3 负责什么

`bidforge-writing-candidate-v0.3` 负责精简小节写作阶段，解决的是：

```text
精简小节怎么写准
```

其主要能力包括：

- 精简小节写作；
- 正式标书口吻控制；
- 写作重心实化；
- 投标主体表达控制；
- 分析框架显性化控制；
- 避免空泛、越界、过度承诺；
- 避免把分析性章节写成施工组织、采购管理或现场管理；
- 控制“我们将 / 我方将”的适用范围和频率。

当前包含规则：

| 规则 | 名称 | 当前用途 |
| --- | --- | --- |
| Rule 001 | 写作重心实化规则 | 将正文重心落到真实项目对象、设计关系、工作动作和成果承接。 |
| Rule 002 | 投标主体与落实路径规则 | 在措施落实类章节中适度使用投标主体表达；分析性章节慎用。 |
| Rule 004 | 分析框架显性化控制规则 | 控制“从……看”“一是、二是、三是”等提纲式表达连续外露。 |

Writing Candidate v0.3 不负责长篇扩写的全部问题。它主要保证精简稿具备正确口吻、清晰边界和基本可扩写性。

## 5. Expansion Candidate v0.2 负责什么

`bidforge-expansion-candidate-v0.2` 负责扩写阶段，解决的是：

```text
精简小节如何扩展为更长篇的正式标书正文
```

其主要能力包括：

- 扩写正文；
- 有效信息增量；
- 扩写正文化转换；
- 连续子节去重；
- Writer / Reviewer / Rewriter / Auditor 角色分离；
- 单小点一万字级内部模块化；
- 模块内压缩与取舍；
- 高风险边界控制；
- Human Review 优先；
- formalization_check、dedup_review、high_risk_boundary_review 等审查流程固定化。

当前包含规则：

| 规则 | 名称 | 当前用途 |
| --- | --- | --- |
| Rule 001 | 有效信息增量规则 | 控制注水、低信息增量和无效安全表达。 |
| Rule 002 | 扩写正文化转换规则 | 清理写作指导语外露和规则语言残留。 |
| Rule 003 | 连续子节去重与节奏控制规则 | 控制跨节重复、成果落点重复和安全收束重复。 |
| Rule 004 | 角色分离扩写流程规则 | 固定 Writer / Reviewer / Rewriter / Auditor 分工。 |
| Rule 005 | 单小点一万字级内部模块化扩写规则 | 要求长篇小点先拆内部模块，再扩写。 |
| Rule 006 | 模块内压缩与取舍规则 | 控制模块内部厚重、闭环重复和防御感。 |

Case 011 还形成了 Candidate Observation 011：高风险边界正向表达规则。该观察项支持 Expansion Candidate v0.2 的高风险边界控制，但尚未单独升级为新 Candidate Skill 或正式规则包。

## 6. Case 012 对当前状态的影响

Case 012 半章节测试暴露出新的流程理解风险：

- 系统容易把半章节组合理解成压缩整合；
- `revised_half_chapter_draft_v2.md` 虽比上一版保留度更高，但仍未真正完成“三个一万字级小点组合成半章节”的目标验证；
- 正文中出现过类似“上述组织方式保留三个小点的主体内容和内部模块”的半章节整合过程语言外露；
- 因此不宜继续简单补 v3，也不宜据此进入 Production RC。

该问题不否定 Writing Candidate v0.3 和 Expansion Candidate v0.2 的候选价值，但说明半章节级组合能力尚未稳定，下一步应先回到端到端试跑，验证从零生成一个一万字级小节的完整链路。

## 7. 当前为什么还不是 Production

当前尚不是 Production，主要原因包括：

- 仍缺少从零开始的端到端试跑；
- 仍缺少真正独立 Reviewer / Auditor；
- 仍缺少真实项目完整工作流测试；
- Word 合稿与正式格式未验证；
- 半章节组合测试目标仍需重新校准；
- 当前仍需人工复核；
- 当前规则仍可能在长篇、半章节或高风险边界场景中误用；
- 正式 `skills/knowledge` 尚未更新，也不应在当前阶段更新。

## 8. 当前阶段判断

当前 BIDFORGE 已经具备两个候选能力包：

```text
Writing Candidate v0.3
Expansion Candidate v0.2
```

它们可以支持下一轮候选区端到端试跑，但不能视为正式 Production Skill，也不能进入 Production RC。下一步更合适的方向是设计并执行一次从零开始的一万字级小节端到端试跑，而不是继续在 Case 012 上补半章节 v3。
