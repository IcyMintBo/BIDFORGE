---
name: bidforge-auditor
description: Use when BIDFORGE needs to audit candidate writing, review, extraction, expression, negative-pattern, or formal-style rules before they can enter Production Skill. The auditor prevents project fact contamination, bad reference-bid learning, hardcoded negative samples, overconservative or overaggressive rules, and internal writing notes from becoming formal bid正文 rules.
---

# BIDFORGE Auditor Skill

## Purpose

Audit whether candidate rules may enter Production Skill.

This skill does not write bid正文, does not review a bid chapter directly, and does not auto-promote any rule.

## Candidate vs Production

- Candidate Skill: experimental rule area for replay testing, manual review, and version comparison.
- Production Skill: approved rule area containing only deprojectized, executable, reviewable, tested, and manually confirmed rules.

## Required Inputs

- Candidate rule.
- Source sample or source explanation.
- Rule type: general rule, project-type rule, expression pattern, negative pattern, formal style rule, test case.
- Proposed destination.
- Replay test result, if available.
- Human confirmation status.

## Audit Checklist

| Audit Item | Question | Result if Failed |
|---|---|---|
| 项目事实误学 | Does the rule contain project name, area, location, period, owner, road, equipment, or other project fact as a general rule? | Reject Production entry |
| 参考标书坏表达 | Does it learn overpromising, old standards, owner-specific slogans, or empty promotion from reference bids? | Return to Candidate |
| 反面教材硬编码 | Does it hardcode specific negative-example content instead of abstracting a problem type? | Require abstraction |
| 可执行性 | Can writing skill act on it? | Rewrite or reject |
| 可审查性 | Can review skill detect it? | Rewrite with trigger features |
| 过度保守 | Would it make the system afraid to write reasonable sourced content? | Downgrade to cautious rule |
| 过度激进 | Would it allow unsupported specific facts or promises? | Reject |
| 项目类型限定 | Is it valid only for a project type such as school, industrial park, municipal road, data center, or public building? | Add project type label |
| 正文口吻污染 | Does it freeze internal language, writing notes, review comments, or self-defense wording into formal正文? | Reject Production entry |
| 小章节回放 | Has it passed replay on a small chapter? | Keep in Candidate |
| 人工确认 | Has a human accepted it after seeing output effect? | Keep in Candidate |

## Production Entry Conditions

A candidate rule may enter Production Skill only if all are true:

- Source is recorded.
- Project-specific facts are removed.
- Scope of application is clear.
- Trigger feature is explicit.
- Action or rewrite direction is explicit.
- Review method is explicit.
- It does not conflict with tender-first principle.
- It has passed at least one small-section replay test.
- Human confirmation is recorded.

## Auditor Output

| 规则编号 | 候选规则 | 规则类型 | 来源 | 审计结论 | 主要问题 | 处理建议 | 是否允许进入 Production |
|---|---|---|---|---|---|---|---|

Audit conclusion must be one of:

- 通过，可进入 Production.
- 暂留 Candidate，需更多回放.
- 退回改写.
- 拒绝.

## Special Attention for Formal Style Rules

Reject rules that make formal正文 contain:

- `本节按照`, `本章主要介绍`, `以下从`.
- `本章节需要`, `此处应体现`, `本段应说明`.
- `避免废标风险`, `不能写没有依据的内容`, `防止扩大责任`.
- Review comments, internal process notes, or model self-defense.

Formal style rules must provide:

- Trigger feature.
- Why it fails formal bid tone.
- Recommended conversion direction.
- Review method.
- Must-fix judgment.

