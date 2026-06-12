---
name: bidforge-bid-writing
description: Use when BIDFORGE needs to draft or rewrite Chinese tender/bid正文 from current project facts, tender requirements, evidence levels, scoring points, and approved expression patterns. This skill writes formal bid text only after establishing writing boundaries, and must avoid unsupported facts, service-scope expansion, overpromising, construction-management wording in design chapters, and AI-style writing notes.
---

# BIDFORGE Bid Writing Skill

## Purpose

Generate formal Chinese tender/bid正文 for the current project. Do not generate project facts from memory and do not import facts from reference bids.

This skill is a Candidate v0.1 rule asset. It must be used with the current project fact base, tender extraction results, scoring matrix, evidence table, and BIDFORGE knowledge files.

## Required References

- `knowledge/tender_extraction_schema.md`
- `knowledge/evidence_level_rules.md`
- `knowledge/expression_patterns.md`
- `knowledge/negative_patterns.md`
- `knowledge/formal_bid_style_rules.md`
- `knowledge/project_fact_vs_rule_isolation.md`

## Highest Priority Rules

- Tender document first.
- Current project facts first.
- Scoring-point structure first.
- A/B-level evidence is required for specific facts, parameters, scope, commitments, systems, quantities, and technical details.
- C/D-level content may only be written with cautious wording.
- E-level content must not be written as fact.
- Do not migrate project names, locations, areas, owners, functions, roads, device parameters, local policies, or project-specific conclusions from reference bids.
- Do not expand service scope.
- Do not overpromise results, approvals, scores, delivery certainty, cost savings, or risk-free outcomes.
- Do not put construction-management wording into design-service chapters unless the tender scope clearly requires it.

## Inputs

- Current project fact base.
- Tender extraction table.
- Scoring-point matrix.
- Evidence-level table.
- Chapter task and target section.
- Project type label, if confirmed.
- Approved expression pattern library.
- Negative pattern library.
- Formal bid style rules.

If any required input is missing, state what is missing and write only within confirmed boundaries.

## Workflow

1. Identify the chapter type: project understanding, design outline, service plan, reasonable suggestions, quality/progress guarantee, risk response, or other.
2. Read the current project fact base and use only current project facts.
3. Read the tender extraction table and identify hard constraints.
4. Read the scoring matrix and list the scoring points this chapter must respond to.
5. Read the evidence table and classify intended content by A/B/C/D/E evidence level.
6. Establish writing boundaries before drafting.
7. Draft正文 using approved expression patterns, not copied reference-bid facts.
8. Convert internal boundaries into formal正文. Do not expose writing notes, review logic, or internal risk-control language.
9. Check formal bid style before returning output.
10. Hand the draft to `bidforge-bid-review` before treating it as usable text.

## Writing Boundary Template

This boundary table is an internal control artifact. Do not place it inside formal bid正文.

| Type | Requirement |
|---|---|
| Usable facts | Only from the current project fact base |
| Required scoring response | From the current scoring matrix |
| Specific content allowed | A/B-level evidence only |
| Cautious content | C/D-level evidence with cautious wording |
| Prohibited content | E-level content, external project facts, unsupported parameters, scope expansion |
| Human confirmation needed | Conflicts, missing facts, unclear scope, ambiguous service boundary |

## Evidence Use

- A-level: Tender document explicitly requires or states it. May be written directly.
- B-level: Current project drawings, scheme, survey, or design material explicitly show it. May be written with source binding.
- C-level: Reasonable inference from current materials. Use cautious wording such as `宜`, `可结合`, `建议进一步复核`, `在深化阶段结合确认`.
- D-level: Industry common principle. Write only principle-level content, not numbers, models, dimensions, brands, or detailed system configuration.
- E-level: Unsupported. Do not write it as fact.

## Formal Bid Style Requirements

Formal正文 must not contain:

- Chapter-explanation wording: `本节按照`, `本章主要介绍`, `以下从`, `后续章节将`, `本部分拟`.
- Writing-task wording: `本章节需要`, `此处应体现`, `本段应说明`, `工程概述部分应`.
- Internal defense wording: `避免废标风险`, `不能写没有依据的内容`, `防止扩大责任`, `坚持正式稳妥口径`.
- Future-section guide wording: `下文将`, `后续章节将围绕`, `后文进一步说明`.
- Markdown residue, misplaced quotation marks, abnormal punctuation, isolated symbols, extra spaces, half phrases, or mixed punctuation.

Before output, check:

- Similar sentence structures do not repeat more than twice in one paragraph.
- `应`, `需`, `可`, `建议`, `通过`, `围绕`, `结合`, `落实` are not mechanically repeated.
- The text reads as project understanding, design judgment, technical control, service boundary, outcome implementation, procedure coordination, or risk review.

## Prohibited Behaviors

- Do not generate a full bid unless the user explicitly requests it.
- Do not invent facts to make the chapter look substantial.
- Do not write unsupported area, floor count, road width, fire system detail, equipment model, material brand, process parameter, traffic flow, logistics organization, structural system, MEP configuration, standard clause, or owner commitment.
- Do not copy reference-bid wording with project facts still attached.
- Do not turn review comments into正文.

## Output

When drafting is requested, return:

1. Brief writing boundary summary.
2. Draft正文 only within confirmed boundaries.
3. Items requiring review or confirmation.
4. Recommendation to run `bidforge-bid-review`.

