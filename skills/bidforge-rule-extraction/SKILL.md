---
name: bidforge-rule-extraction
description: Use when BIDFORGE needs to extract reusable rules from multi-project samples, tender files, reference bids, negative examples, model drafts, human edits, comments, and review reports. This skill separates project facts from reusable rules and sends only candidate rules to Auditor review.
---

# BIDFORGE Rule Extraction Skill

## Purpose

Extract reusable BIDFORGE rules from samples without polluting general skills with specific project facts.

This skill does not write bid正文 and does not promote rules to Production Skill.

## Required References

- `knowledge/project_fact_vs_rule_isolation.md`
- `knowledge/tender_extraction_schema.md`
- `knowledge/expression_patterns.md`
- `knowledge/negative_patterns.md`
- `knowledge/formal_bid_style_rules.md`

## Inputs

- Tender files.
- Reference bids.
- Negative examples.
- Scheme, drawing, or project materials.
- Model raw output.
- Human revised version.
- User comments.
- Review reports.
- Project type label, if confirmed.

## Workflow

1. Identify which project each sample belongs to. If unclear, mark `未知/需人工确认`.
2. Classify material type: tender file, reference bid, negative example, scheme material, drawing material, model draft, human edit, review report, or other.
3. Remove project-specific facts before judging whether the remaining pattern is reusable.
4. Extract tender information types from tender files, not fixed project facts.
5. Extract expression patterns from reference bids, not project content.
6. Extract problem types from negative examples, not whole negative samples.
7. Compare model raw output and human edits.
8. Convert useful differences into `trigger feature + judgment reason + rewrite direction + review method`.
9. Send candidates to `bidforge-auditor`; do not update Production Skill directly.

## What Must Not Enter General Skills

- Project name.
- Location.
- Owner or employer name.
- Area, investment, period, building number, road name, function positioning.
- Equipment parameter, material brand, technical configuration.
- Region-specific policy.
- Old or unverified standards.
- Project-specific conclusion.

## Reference Bid Extraction Rules

Extract only:

- Chapter organization.
- Design-institute wording.
- Cautious expression.
- Scoring-point response method.
- Quality/progress/service expression.
- Multi-discipline coordination expression.
- Limit design expression.
- Follow-up service expression.
- Risk-control expression.

Do not copy reference bid facts or whole paragraphs as rules.

## Negative Example Extraction Rules

Extract problem types such as:

- 泛泛而谈.
- 套话堆叠.
- 章节过度展开.
- 无项目事实支撑.
- 无评分点对应.
- 无图纸依据具体化.
- 过度承诺.
- 服务范围扩大.
- 施工管理口径混入设计服务.
- 外项目内容迁移.
- 专业术语堆砌.
- 绝对化表达.
- 前后矛盾.

For each problem type, record:

- Detection feature.
- Why it is dangerous.
- How review skill should detect it.
- How writing skill should avoid it.

## Human Edit Difference Rules

For each `model draft -> human edit` difference, record:

| Field | Meaning |
|---|---|
| 原稿片段 | Model-generated text |
| 人工修改片段 | User-approved revision |
| 修改类型 | deletion, risk reduction, fact correction, boundary control, compression, reorganization, style conversion |
| 触发特征 | What pattern caused the edit |
| 判断理由 | Why the original was weak or risky |
| 改写方向 | How future drafts should change |
| 审查方法 | How review skill can detect it |
| 是否可泛化 | yes / no / needs more samples |
| 推荐进入位置 | Candidate Skill / knowledge library / project fact base / test case only |

Formal style rules cannot be treated as one preferred sentence. They must be generalizable, reviewable, and executable.

## Output

Return a candidate rule package:

1. Sample classification summary.
2. Removed project-specific facts.
3. Candidate general rules.
4. Candidate project-type rules.
5. Candidate expression patterns.
6. Candidate negative patterns.
7. Candidate formal style rules.
8. Items requiring Auditor review.

