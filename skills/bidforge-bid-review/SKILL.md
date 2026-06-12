---
name: bidforge-bid-review
description: Use when BIDFORGE needs to review Chinese tender/bid text for tender responsiveness, fact source, evidence level, scoring-point coverage, service-scope boundary, overpromising, unsupported technical details, negative patterns, formal bid wording, and AI-writing traces. Always output a structured review table.
---

# BIDFORGE Bid Review Skill

## Purpose

Review tender/bid text before it becomes usable draft content. The review must distinguish hard risks, scoring risks, expression optimization, and formal正文口吻 problems.

This skill reviews text; it does not rewrite full chapters unless the user asks for a revision.

## Required References

- `knowledge/tender_extraction_schema.md`
- `knowledge/evidence_level_rules.md`
- `knowledge/negative_patterns.md`
- `knowledge/formal_bid_style_rules.md`
- `knowledge/project_fact_vs_rule_isolation.md`

## Inputs

- Text to review.
- Current project fact base.
- Tender extraction table.
- Scoring-point matrix.
- Evidence-level table.
- Chapter type.
- Project type label, if confirmed.

If sources are missing, identify the missing source and avoid definitive claims.

## Review Workflow

1. Confirm the text belongs to the current project and target chapter.
2. Check tender responsiveness and scoring-point coverage.
3. Check whether each project fact has a current-project source.
4. Check technical details against evidence levels.
5. Check service-scope expansion and design/construction boundary.
6. Check overpromising, absolute wording, and guarantee language.
7. Check external-project traces.
8. Check negative patterns.
9. Run formal bid style and AI-trace review.
10. Output structured findings with risk category and modification advice.

## Required Review Table

| 问题编号 | 所在章节 | 问题类型 | 问题描述 | 依据来源 | 风险等级 | 风险类别 | 修改建议 |
|---|---|---|---|---|---|---|---|

Risk category must be one of:

- 废标风险
- 扣分风险
- 表达优化
- 正文口吻问题

Risk level must be:

- 高: may affect responsiveness, factual correctness, contract boundary, or external-project contamination.
- 中: may affect score, professional credibility, or wording stability.
- 低: mainly clarity, repetition, or expression polish.

## Core Review Items

| Review Item | Detection Method | Typical Risk |
|---|---|---|
| 招标响应 | Check tender scope, employer requirements, document composition, scoring points | 废标风险 / 扣分风险 |
| 事实来源 | Check whether project facts exist in current fact base | 高 |
| 评分点覆盖 | Check whether scoring matrix items are missing | 中 / 高 |
| 服务范围扩大 | Check unsupported service, duty, resident service, management obligation | 高 |
| 过度承诺 | Check absolute guarantees and result promises | 中 / 高 |
| 外项目痕迹 | Check other project names, locations, owners, functions, roads | 高 |
| 图纸无依据内容 | Check whether technical details lack A/B evidence | 高 |
| 空泛套话 | Check no fact, no scoring point, no outcome | 中 |
| 施工口径混入设计 | Check construction organization language in design chapters | 中 / 高 |
| 前后矛盾 | Check period, scope, quality, service, facts | 高 |
| 正文口吻 / AI 写作痕迹 | Check formal正文 issues listed below | 中 / 高 |

## Formal Wording and AI-Trace Review

Specially identify:

- 章节说明感: `本节按照`, `本章主要介绍`, `以下从`, `本部分拟`.
- 写作任务感: `本章节需要`, `此处应体现`, `本段应说明`, `工程概述部分应`.
- 自我防御感: `避免废标风险`, `不能写没有依据的内容`, `防止扩大责任`.
- 后续章节导读: `后续章节将`, `下文将`, `后文进一步说明`.
- 机械重复: repeated sentence starts, repeated control words, repeated closing sentences.
- Markdown 残留: `#`, `**`, code fences, list symbols used as artifacts.
- 错位引号, 异常空格, 孤立标点, 半截短语, 中英文标点混乱.

Use this专项 table when formal wording issues are found:

| 原句 | 问题类型 | 为什么不像正式标书 | 推荐改写 | 是否属于必须修改 |
|---|---|---|---|---|

Must-fix:

- Chapter-explanation wording.
- Writing-task wording.
- Internal defense wording.
- Markdown residue or abnormal symbol artifacts.
- Unsupported facts written as definite project facts.

## Modification Advice Rules

- For hard risks, propose deletion or replacement with sourced wording.
- For missing evidence, say what source is needed.
- For C/D-level content, propose cautious wording.
- For formal wording issues, convert writing notes into project understanding, design judgment, technical control, service boundary, outcome implementation, procedure coordination, or risk review.
- Do not silently expand the chapter while fixing risks.

