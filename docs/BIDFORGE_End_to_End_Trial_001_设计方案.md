# BIDFORGE End-to-End Trial 001 设计方案

## 1. 试跑名称

```text
End-to-End Trial 001：从零生成一万字级标书小节
```

本方案只设计试跑流程，不启动 Trial 001，不生成 Trial 001 正文，不进入 Production，不进入 Production RC，不更新正式 `skills/knowledge`。

## 2. 试跑背景

BIDFORGE 当前已经形成两个候选能力包：

```text
candidate_skills/bidforge-writing-candidate-v0.3/
candidate_skills/bidforge-expansion-candidate-v0.2/
```

Case 001-006 已验证精简小节写作；Case 007-011 已验证局部扩写、多子节连续扩写、单小点一万字级扩写和高风险边界表达。Case 012 暴露出半章节组合容易被误解为压缩整合，说明当前不宜继续简单补半章节稿，也不宜进入 Production RC。

因此，下一轮更适合从一个新的章节目标出发，重新验证 Writing Skill 与 Expansion Skill 能否从零协同生成一个一万字级标书小节。

## 3. 试跑目标

Trial 001 的目标是从一个新的章节目标出发，不复用某个 Case 的中间稿，完整测试以下链路：

```text
章节目标
→ 精简版生成
→ 精简版审查
→ 精简版修正
→ 扩写计划
→ 一万字级扩写
→ 正文化检查
→ 去重检查
→ 高风险边界检查
→ 最终修正版
→ Auditor 判断
```

这次试跑验证的不是半章节组合，也不是 5 万字全文，而是：

```text
从零生成一个 8000-12000 字级正式标书小节
```

## 4. 本轮应使用的 Candidate Skill

Trial 001 必须同时使用：

```text
candidate_skills/bidforge-writing-candidate-v0.3/
candidate_skills/bidforge-expansion-candidate-v0.2/
```

试跑目录中必须创建：

```text
used_skill_manifest.md
```

`used_skill_manifest.md` 应记录：

- 实际读取的 Skill 文件；
- 启用的 Writing Rule；
- 慎用的 Writing Rule；
- 启用的 Expansion Rule；
- 观察项；
- 禁止误用；
- 本轮规则应用计划。

如果没有实际读取某个 Candidate Skill 文件，不得声称使用该 Skill。

## 5. 规则使用建议

### 5.1 Writing Candidate v0.3

启用：

- Rule 001：写作重心实化规则；
- Rule 004：分析框架显性化控制规则。

慎用：

- Rule 002：投标主体与落实路径规则。

慎用原因：

- Trial 001 建议选择偏技术管理或设计控制类小节；
- 可以适度使用“我方将 / 我们将”表达落实路径；
- 但不得让投标主体表达变成全篇主导句式；
- 不得承诺审批结果、质量零问题、全部解决或外部主体认可。

### 5.2 Expansion Candidate v0.2

启用：

- Rule 001：有效信息增量规则；
- Rule 002：扩写正文化转换规则；
- Rule 003：连续子节去重与节奏控制规则；
- Rule 004：角色分离扩写流程规则；
- Rule 005：单小点一万字级内部模块化扩写规则；
- Rule 006：模块内压缩与取舍规则。

重点观察：

- 写作指导语外露；
- 规则语言正文化不足；
- 长文车轱辘；
- 成果落点重复；
- 安全表达重复；
- 模块化机械拆分；
- 模块内过度闭环；
- 高风险边界防御感；
- 无依据事实、过度承诺和服务范围扩大。

## 6. 建议目录结构

```text
trials/end_to_end_001/
  input/
    trial_brief.md
    source_materials.md
    used_skill_manifest.md
    writing_skill_snapshot.md
    expansion_skill_snapshot.md
  output/
    compact_draft.md
    compact_review.md
    compact_revised.md
    expansion_plan.md
    expanded_draft.md
    review_expanded_draft.md
    formalization_check.md
    dedup_review.md
    high_risk_boundary_review.md
    revised_expanded_draft.md
    final_review.md
    auditor_result.md
    diff_learning.md
```

## 7. 输入文件设计

### 7.1 trial_brief.md

应记录：

- Trial 编号；
- 章节目标；
- 目标字数：8000-12000 字；
- 输入材料范围；
- 本轮启用规则；
- 本轮禁止事项；
- 审查重点；
- 通过标准。

### 7.2 source_materials.md

应只记录本轮允许使用的项目资料，不得从 Case 009、010、011 的中间稿复制正文。

建议内容包括：

- 项目基础描述；
- 招标文件或已知需求摘要；
- 章节目标；
- 可使用事实；
- 不得编造的事实；
- 服务边界；
- 待确认事项。

### 7.3 writing_skill_snapshot.md

摘录 Writing Candidate v0.3 中本轮相关规则：

- Rule 001；
- Rule 002，标注慎用；
- Rule 004。

### 7.4 expansion_skill_snapshot.md

摘录 Expansion Candidate v0.2 中本轮相关规则：

- Rule 001；
- Rule 002；
- Rule 003；
- Rule 004；
- Rule 005；
- Rule 006。

## 8. 输出流程设计

### 8.1 compact_draft.md

Writer 基于章节目标和 source_materials 先生成精简版小节。

要求：

- 不追求长篇；
- 正式标书正文口吻；
- 不空泛；
- 不越界；
- 不过度承诺；
- 不写成写作说明。

### 8.2 compact_review.md

Reviewer 只审查精简稿，不重写。

重点检查：

- 是否符合章节目标；
- 是否正式；
- 是否空泛；
- 是否越界；
- 是否过度承诺；
- 是否存在分析框架显性化；
- 是否具备可扩写基础。

### 8.3 compact_revised.md

Rewriter 只根据 `compact_review.md` 修正精简稿。

要求：

- 不新增无依据事实；
- 不扩大服务范围；
- 不把审查语言带入正文；
- 保持精简稿可扩写。

### 8.4 expansion_plan.md

基于 `compact_revised.md` 设计一万字级扩写计划。

要求：

- 目标 8000-12000 字；
- 拆分 6-8 个内部模块；
- 每个模块承担不同功能；
- 每个模块说明信息增量；
- 每个模块说明禁止写入内容；
- 每个模块说明如何避免车轱辘；
- 不直接复用 Case 009、010、011 的模块结构。

### 8.5 expanded_draft.md

Writer 根据 `expansion_plan.md` 扩写正文。

要求：

- 目标 8000-12000 字；
- 不继续扩写成 5 万字；
- 不出现写作指导语外露；
- 不出现规则语言正文化不足；
- 不重复成果清单；
- 不编造参数、面积、容量、品牌、审批结论；
- 不写成施工组织、采购管理或现场管理；
- 不承诺审批结果。

### 8.6 review_expanded_draft.md

Reviewer 只审查，不重写。

重点检查：

- 是否达到 8000-12000 字量级；
- 是否车轱辘；
- 是否每个模块有信息增量；
- 是否有重复段落；
- 是否有无依据事实；
- 是否过度承诺；
- 是否扩大服务范围；
- 是否正式标书口吻不足。

### 8.7 formalization_check.md

专项检查：

- 写作指导语外露；
- 规则语言正文化不足；
- “应、需要、不宜、避免、不能”等规则语言密度；
- 审查报告口吻；
- 内部流程语言外露；
- 正式标书正文口吻。

未通过则不得进入 Auditor 判断。

### 8.8 dedup_review.md

专项检查：

- 模块之间是否重复；
- 同一观点是否换说法反复出现；
- 成果落点是否重复；
- 边界说明是否重复；
- 安全收束是否重复；
- 哪些段落可删除、压缩或合并。

### 8.9 high_risk_boundary_review.md

专项检查：

- 是否承诺审批结果；
- 是否替主管部门表态；
- 是否替外部单位确认；
- 是否扩大服务范围；
- 是否把待确认事项写成确定事实；
- 是否存在防御式边界堆叠；
- 是否能通过正向工作路径表达边界。

### 8.10 revised_expanded_draft.md

Rewriter 只根据三类审查文件修正：

- `review_expanded_draft.md`
- `formalization_check.md`
- `dedup_review.md`
- `high_risk_boundary_review.md`

不得重新发明结构，不得新增无依据事实，不得继续扩大篇幅。

### 8.11 final_review.md

最终检查：

- 正文化是否通过；
- 去重是否通过；
- 高风险边界是否通过；
- 是否仍像正式标书正文；
- 是否仍需人工复核。

### 8.12 auditor_result.md

Auditor 只判断流程和结果：

- Trial 001 是否完成；
- Writing Skill 是否有效；
- Expansion Skill 是否有效；
- 精简稿是否合格；
- 扩写计划是否合格；
- 一万字级扩写是否合格；
- final_review 是否通过；
- 是否建议进入 Production：否；
- 是否建议进入 Production RC：否；
- 是否需要人工复核：是。

### 8.13 diff_learning.md

记录：

- 哪些规则有效；
- 哪些规则误用；
- 是否出现新观察项；
- 是否需要补充 Expansion Candidate；
- 是否适合后续独立 Reviewer / Auditor 测试；
- 是否适合继续做 Word 合稿测试。

## 9. 推荐 Trial 001 章节目标

### 推荐目标 A：质量控制与成果校审措施

推荐作为首选。

理由：

- 未直接重复 Case 009、010、011 的测试小点；
- 适合从零生成精简稿，再扩写到一万字级；
- 能同时测试 Writing Skill 的正式口吻、实化表达和投标主体边界；
- 能测试 Expansion Skill 的内部模块化、信息增量、去重和模块内压缩；
- 风险适中，不像主管部门审查衔接那样高度敏感，但仍能观察过度承诺问题；
- 容易检查是否写成“保证质量零问题”等不当承诺；
- 适合设置成果校审、专业复核、资料一致性、校审闭环、问题反馈、成果交付边界等内部模块。

建议内部方向：

- 质量控制对象与成果范围；
- 资料依据和设计前提校核；
- 专业自校与交叉校审；
- 多专业成果一致性复核；
- 问题闭环与修改记录；
- 成果提交前完整性检查；
- 后续技术配合边界。

### 推荐目标 B：设计优化思路

可作为备选。

理由：

- 能验证 Writing Rule 001 和 Rule 004 在分析性章节中的表现；
- 能检查“设计优化”是否被写成抽象口号；
- 能观察 Rule 002 是否被误用为过度“我们将”；
- 可扩展为一万字级正文，但需要明确 source_materials，避免空泛。

风险：

- 若输入材料不足，容易写成泛化设计理念；
- 若控制不当，容易出现“优化应、设计应、可以按照”等规则语言；
- 需要更严格的 formalization_check。

### 不建议 Trial 001 首选的章节

暂不建议首选：

- 后续服务与审查配合措施：高风险边界较多，容易把 Trial 001 变成 Case 011 的延伸；
- 施工图深化阶段专业协同措施：与 Case 010 的“多专业条件传递与接口复核机制”过近；
- 合理化建议落实路径：Rule 002 容易成为主导，可能不利于测试 Writing 与 Expansion 的均衡衔接。

## 10. Trial 001 通过标准

Trial 001 通过标准如下：

1. 能从章节目标生成精简版；
2. 精简版符合正式标书口吻；
3. 精简版没有空泛、越界、过度承诺；
4. 能生成合理扩写计划；
5. 扩写计划包含 6-8 个功能明确的内部模块；
6. 能扩写到 8000-12000 字；
7. 长文不车轱辘；
8. 无写作指导语外露；
9. 无规则语言正文化不足；
10. 无无依据事实；
11. 无过度承诺；
12. 无服务范围扩大；
13. 去重审查通过或仅有低风险问题；
14. 高风险边界审查通过；
15. final_review 明确通过；
16. Auditor 明确 Trial 001 可视为候选区端到端通过；
17. 最终稿仍需人工复核。

若任一关键检查未通过，Trial 001 不得判定通过，也不得进入 Production 或 Production RC。

## 11. 本轮边界

本方案阶段明确禁止：

- 不写 Trial 001 正文；
- 不启动 Trial 001；
- 不创建 Trial 001 输出稿；
- 不进入 Production；
- 不进入 Production RC；
- 不更新正式 `skills/knowledge`；
- 不接前台；
- 不创建正式 Skill。

## 12. 方案结论

Trial 001 推荐以“质量控制与成果校审措施”为首选章节目标，验证 Writing Candidate v0.3 与 Expansion Candidate v0.2 能否从零生成一个 8000-12000 字级正式标书小节。

该试跑应先生成精简稿，再经过审查和修正进入扩写计划，最后进行一万字级扩写、正文化检查、去重检查、高风险边界检查和 Auditor 判断。Trial 001 完成后，仍需人工复核，不能自动进入 Production 或 Production RC。
