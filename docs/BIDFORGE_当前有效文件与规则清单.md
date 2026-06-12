# BIDFORGE 当前有效文件与规则清单

## 1. 当前真正生效的 Candidate Skill

当前 BIDFORGE 仍处于 Candidate Skill 验证阶段，尚未进入 Production，也未进入 Production RC。当前真正作为候选能力启用的只有以下两套 Candidate Skill：

```text
candidate_skills/bidforge-writing-candidate-v0.3/
candidate_skills/bidforge-expansion-candidate-v0.3/
```

当前规则仍保留在 `candidate_skills/`、审计文件和试跑输出中，不进入正式 `skills/knowledge`，不接入前台，不创建正式 Production Skill。

### Writing Candidate v0.3

路径：

```text
candidate_skills/bidforge-writing-candidate-v0.3/
```

作用：

* 精简小节写作；
* 正式标书口吻控制；
* 写作重心实化；
* 投标主体表达控制；
* 分析框架显性化控制；
* 避免空泛、越界、过度承诺。

核心文件：

```text
candidate_skills/bidforge-writing-candidate-v0.3/README.md
candidate_skills/bidforge-writing-candidate-v0.3/rules.md
candidate_skills/bidforge-writing-candidate-v0.3/auditor_notes.md
```

当前规则包包括：

* Candidate Rule 001：写作重心实化规则；
* Candidate Rule 002：投标主体与落实路径规则；
* Candidate Rule 004：分析框架显性化控制规则。

Writing Candidate v0.3 主要负责精简小节写作阶段，保证精简稿具备正式标书口吻、清晰边界、分析对象实化和基本可扩写性。它不负责解决全部长篇扩写问题，也不代表正式 Production 写作能力。

### Expansion Candidate v0.3

路径：

```text
candidate_skills/bidforge-expansion-candidate-v0.3/
```

作用：

* 扩写正文；
* 有效信息增量控制；
* 扩写正文化转换；
* 连续子节去重与节奏控制；
* Writer / Reviewer / Rewriter / Auditor 角色分离；
* 单小点一万字级内部模块化；
* 模块内压缩与取舍；
* 扩写类型判断；
* 通用内容正文化填充；
* 关系逻辑型扩写信息密度控制。

核心文件：

```text
candidate_skills/bidforge-expansion-candidate-v0.3/README.md
candidate_skills/bidforge-expansion-candidate-v0.3/rules.md
candidate_skills/bidforge-expansion-candidate-v0.3/auditor_notes.md
```

当前规则包包括：

* Candidate Expansion Rule 001：有效信息增量规则；
* Candidate Expansion Rule 002：扩写正文化转换规则；
* Candidate Expansion Rule 003：连续子节去重与节奏控制规则；
* Candidate Expansion Rule 004：角色分离扩写流程规则；
* Candidate Expansion Rule 005：单小点一万字级内部模块化扩写规则；
* Candidate Expansion Rule 006：模块内压缩与取舍规则；
* Candidate Expansion Rule 007：扩写类型判断规则；
* Candidate Expansion Rule 008：通用内容正文化填充规则；
* Candidate Expansion Rule 009：关系逻辑型扩写信息密度规则。

Expansion Candidate v0.3 来源于 Expansion Candidate v0.2 的规则积累、Trial 001 的 `2.1 项目区位分析` 扩写失败样本，以及 Patch Validation 001 的 `1.2 功能定位` 成功样本。v0.3 仍为 Candidate，只用于候选区扩写测试和后续迁移验证，不代表正式生产能力。

### v0.3 阶段限制

当前阶段必须明确：

* v0.3 仍为 Candidate；
* 不进入 Production；
* 不进入 Production RC；
* 不更新正式 `skills/knowledge`；
* 不接入前台；
* 不创建正式 Expansion Skill；
* 不跳过 Human Review、Reviewer 或 Auditor；
* 不把一次试跑产物直接等同于正式生效规则。

## 2. 当前不是正式生效规则的内容

### lab_cases/

作用：训练样本和验证样本。

`lab_cases/` 不直接生效。只有被整理进当前有效 Candidate Skill 的规则，才参与当前流程。历史 Case 的正文、审查文件、人工修改稿和 diff learning 可以作为证据来源，但不能自动等同于当前运行规则。

### audits/

作用：阶段审计和升级判断。

`audits/` 不直接写正文，也不直接替代 Candidate Skill。它们用于判断 Candidate 是否稳定、是否需要迁移验证、是否可以进入下一阶段。审计结论可以指导流程，但不应被当作全部当前规则。

### trials/

作用：端到端试跑和补丁验证记录。

`trials/` 记录当前或历史试跑过程。Trial 001 的失败稿、Patch Validation 001 的验证稿和审计结论都可以作为候选规则来源或样本证据，但不能把中间稿、失败稿、临时计划或单次成功稿直接当成正式生效规则。

### docs/

作用：流程说明、状态说明、路线图。

`docs/` 用于恢复上下文和指导流程，不等于正式规则。当前清单属于状态导航文件，用于说明哪些文件在当前阶段真正启用，哪些只是历史、样本、审计或流程依据。

### skills/

正式 Skill 目录。

当前不要更新 `skills/`。该目录不代表当前 Candidate 已进入 Production，也不代表 Trial 001 或 Patch Validation 001 已完成正式能力升级。

### knowledge/

正式知识库目录。

当前不要更新 `knowledge/`。当前规则仍保留在 `candidate_skills/`、审计文件和 Trial 输出中，不代表已经进入正式知识库。

## 3. 历史版本说明

以下目录为历史候选版本，仅作为阶段记录保留：

```text
candidate_skills/bidforge-writing-candidate-v0.1/
candidate_skills/bidforge-writing-candidate-v0.2/
candidate_skills/bidforge-expansion-candidate-v0.1/
candidate_skills/bidforge-expansion-candidate-v0.2/
```

当前试跑默认不使用这些历史版本。后续如果需要回溯规则来源，可以读取历史版本和对应 Case；但启动新的写作或扩写任务时，不应默认加载这些历史候选包。

## 4. 后续任何新任务的默认读取规则

以后启动写作或扩写任务时，默认只读取：

```text
candidate_skills/bidforge-writing-candidate-v0.3/
candidate_skills/bidforge-expansion-candidate-v0.3/
```

并创建：

```text
used_skill_manifest.md
```

`used_skill_manifest.md` 必须记录实际读取内容、启用规则、慎用规则、未启用规则和本轮边界。

若任务只涉及精简写作，可只启用 Writing Candidate v0.3。若任务进入扩写阶段，才启用 Expansion Candidate v0.3，并在扩写前执行扩写类型判断，明确是否属于事实密集型、关系逻辑型或措施路径型；关系逻辑型扩写还应关注通用内容正文化和有效信息密度控制。
