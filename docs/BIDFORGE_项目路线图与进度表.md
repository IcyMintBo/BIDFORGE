# BIDFORGE 项目路线图与进度表

更新时间：2026-05-28

维护规则：

- 每完成一个阶段，将“完成”列从 `[ ]` 改为 `[x]`。
- “当前状态”只保留一个主状态：已完成 / 基本完成 / 进行中 / 下一步 / 未开始 / 暂缓。
- 如果阶段产物发生变化，优先更新“关键产物”和“完成标准”，不要另开一套路线。
- Candidate Skill 不能自动升级为 Production Skill，必须经过回放测试和 Auditor 审计。

## 总路线表

| 完成 | 阶段 | 目标 | 关键产物 | 完成标准 | 当前状态 |
|---|---|---|---|---|---|
| [x] | 0. 产品方向确认 | 明确 BIDFORGE 是本地 AI 标书工作台，不是普通后台 | 产品定位、前台 UI 方向、Forge Lab 概念 | 认可整体方向 | 已完成 |
| [x] | 1. 前台高保真原型 | 先把写标书的主界面定下来 | React 前台界面、导航、欢迎横幅、主编辑区、弹窗模块 | 页面像真实软件，结构可扩展 | 基本完成 |
| [x] | 2. 通用规则母文档 | 先让系统知道什么能写、不能写、怎么审、怎么保持正式标书口吻 | `docs/BIDFORGE_通用规则体系与样本归纳报告.md` | 不绑定单个项目，规则可复用 | 已完成 |
| [x] | 3. 规则资产拆分 | 把报告拆成可执行 Skill 和知识库 | `skills/`、`knowledge/`、`lab_cases/` | Codex 后续能直接按这些文件执行 | 已完成 |
| [x] | 4. 样本入库与分类 | 把 `samples` 变成可管理的多项目样本库 | `samples/sample_inventory.md`、`knowledge/sample_classification_rules.md` | 不混项目，不把项目事实学成通用规则 | 已完成 |
| [x] | 5. 第一轮小章节回放 | 不写整本标书，只测一个小章节 | 模型原稿、审查报告、修正版、人工改稿、差异学习报告 | 能验证规则是否真的改善文本 | 已完成：Case 001、Case 002 已形成候选规则 |
| [x] | 6. Candidate Skill 迭代 | 让规则先在候选区演化 | `candidate_skills/bidforge-writing-candidate-v0.1/` | 规则有来源、有测试、有人工确认 | 已完成 v0.1 |
| [ ] | 7. Auditor 审计 | 防止坏规则进入正式系统 | Auditor 审查表、通过/驳回记录 | 项目事实、坏表达、过度规则不会污染正式 Skill | 下一步要做 |
| [ ] | 8. 准生产规则包 RC v0.1 | 形成第一版可发布候选写作/审查能力 | 写作 Skill、审查 Skill、规则提取 Skill、Auditor Skill | 可用于本地 Runner 验证，但仍不能直接算正式 Production | 未开始 |
| [ ] | 9. 本地工作流 Runner | 先不用 UI，跑通本地写作/审查流程 | 本地运行脚本或流程命令、输出目录、日志 | 能从项目文件夹生成小节、审查并导出 Markdown | 未开始 |
| [ ] | 10. Forge Lab MVP | 做后台规则控制台，不追求完整训练 | Forge Lab 页面、密码入口、规则资产展示 | 能看到 Skill、规则库、候选规则、测试记录 | 未开始 |
| [ ] | 11. 前台接入 Skill | 前台按钮开始调用真实规则流程 | 写作、审查、风险提示、项目文件读取入口 | 不再只是静态 UI，可以跑本地工作流 | 未开始 |
| [ ] | 12. 本地项目工作区 | 支持一个真实项目文件夹 | `workspace`、草稿、样本、输出、日志目录 | 每个项目资料独立保存 | 未开始 |
| [ ] | 13. 导出与交付 | 形成可交付草稿 | Markdown 合稿、审查报告、修改建议清单，后续 Word | 能拿去人工整理成正式标书 | 未开始 |
| [ ] | 14. 个人正式上线 | 可以稳定用 BIDFORGE 做真实标书辅助 | BIDFORGE Local v1.0 | 能建项目、读资料、写小节、审查、导出 | 未开始 |

## 当前定位

当前已完成第 0、1、2、3、4、5、6 阶段。

下一步进入第 7 阶段：Auditor 审计。

第 3 阶段已将 `docs/BIDFORGE_通用规则体系与样本归纳报告.md` 拆成以下可执行规则资产：

- `skills/bidforge-bid-writing/SKILL.md`
- `skills/bidforge-bid-review/SKILL.md`
- `skills/bidforge-rule-extraction/SKILL.md`
- `skills/bidforge-auditor/SKILL.md`
- `knowledge/tender_extraction_schema.md`
- `knowledge/evidence_level_rules.md`
- `knowledge/expression_patterns.md`
- `knowledge/negative_patterns.md`
- `knowledge/formal_bid_style_rules.md`
- `knowledge/project_fact_vs_rule_isolation.md`
- `lab_cases/README.md`

## 暂不做事项

- 不生成正式标书正文。
- 不修改前台界面。
- 不接入 Forge Lab。
- 不做模型微调。
- 不把具体项目事实写进通用 Skill。
- 不把某一句示例改写当成通用规则。
- 不把 Candidate Skill 自动升级为 Production Skill。
