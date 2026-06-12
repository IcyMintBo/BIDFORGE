# BIDFORGE MVP 第一阶段前端闭环验收

## 1. 阶段目标

本阶段目标是完成 BIDFORGE 第一阶段前端 MVP 最小闭环：

```text
前台选择章节 → 点击生成精简稿 → runnerApi mock 返回 Markdown → 前台显示 running / success / failed 状态 → Markdown 结果预览 → 下载 Markdown
```

本阶段只验证前端交互链路、任务状态、结果预览和导出入口，不接真实 AI Runner，不读取真实本地文件，不写入真实 `runs/`，不进入 Production 或 Production RC。

## 2. 已完成能力

| 能力 | 状态 | 说明 |
| ---- | ---- | ---- |
| 章节选择 | 已完成 | 前台可选择章节，默认支持 `5.1 建筑设计`。 |
| 生成按钮 | 已完成 | 草稿区提供 `生成精简稿` 按钮。 |
| 任务状态 | 已完成 | 支持 `idle`、`running`、`success`、`failed` 状态；底部状态栏展示当前状态。 |
| Markdown 预览 | 已完成 | 生成成功后在正文区域展示 Markdown 内容。 |
| Markdown 下载 | 已完成 | 通过导出入口下载当前章节 Markdown 文件。 |
| runnerApi mock | 已完成 | `generateCompactSection` 以 mock Promise 模拟 Runner 返回。 |
| Candidate Skill 摘要 | 已完成 | 前台展示 Writing v0.3、Expansion v0.3、未进入 Production、未进入 Production RC。 |
| build 通过 | 已完成 | `npm run build` 已通过。 |

## 3. 新增与修改文件

### 3.1 新增文件

| 文件 | 作用 |
| ---- | ---- |
| `src/types/runner.ts` | 定义 Runner 任务输入、结果、状态和前端任务状态结构，为后续真实 Runner API 预留类型边界。 |
| `src/services/runnerApi.ts` | 提供前端 mock Runner API，当前模拟延迟并返回 Markdown、文件名和 Candidate Skill 摘要。 |
| `src/utils/download.ts` | 提供浏览器端 Markdown 下载工具，使用 Blob 生成 `.md` 文件下载。 |

### 3.2 修改文件

| 文件 | 作用 |
| ---- | ---- |
| `src/App.tsx` | 接入 Runner 任务状态、章节选择、生成触发、导出弹窗和 Markdown 下载流程。 |
| `src/data/mockData.ts` | 补齐 MVP 演示项目、章节、草稿、风险等 mock 数据，并保证 `5.1 建筑设计` 可作为默认章节。 |
| `src/components/DraftEditor.tsx` | 接入章节选择、生成按钮、Markdown 预览、Candidate Skill 摘要和底部任务状态展示。 |
| `src/components/ChapterProgressPanel.tsx` | 支持点击章节切换，并根据当前任务状态展示运行中的章节进度。 |
| `src/components/RiskPanel.tsx` | 调整风险展示类型和中文文案，保持与当前 mock 数据一致。 |
| `src/components/ExportDialog.tsx` | 增加导出文档弹窗，支持当前章节 Markdown 导出入口，并预留整个文档和 Word 选项。 |
| `src/components/HeroBanner.tsx` | 将首页 `导出文档` 卡片接入导出弹窗入口。 |
| `src/index.css` | 增加 Runner 状态、Markdown 预览、导出弹窗、卡片选择器和复古视觉样式。 |

## 4. 当前仍是 mock 的部分

当前仍是 mock 或前端模拟的内容包括：

* `runnerApi` 是 mock；
* Markdown 正文是 mock；
* 任务状态是前端模拟；
* Candidate Skill 摘要是 mock；
* 未接真实 AI；
* 未读取 PDF/DOCX；
* 未读取 `candidate_skills/`；
* 未写入真实 `runs/`；
* 未做 Word 导出。

本阶段不代表真实写作能力已经接入，也不代表 Candidate Skill 进入 Production 或 Production RC。

## 5. 阶段意义

第一阶段完成后，BIDFORGE 已从静态 UI 原型进入可交互前端 MVP。

用户已经能够在前台看到一次完整的最小工作流：

```text
选择章节 → 触发生成 → 状态变化 → 查看 Markdown → 导出 Markdown
```

这意味着 BIDFORGE 已经具备产品工作台的基本交互骨架。前端已经为后续真实 Runner 预留接口层，后续不需要重写前台流程，只需要逐步替换 `src/services/runnerApi.ts` 的实现，将 mock Promise 替换为真实本地 API 调用。

## 6. 下一阶段候选方向

### A. Node/Express 本地 Runner 雏形

目标：

```text
前端点击生成 → POST /api/runs → 后端创建 runs 目录 → 写 task.json/prompt.md/draft.md/auditor_result.md → 返回 Markdown
```

特点：

* 不接真实 AI；
* 不解析 PDF/DOCX；
* 不加载真实 Skill；
* 先验证本地文件写入和前后端通信；
* 将前端 mock 状态推进为真实本地任务记录。

适合作为第二阶段。原因是第一阶段已经证明前台闭环可用，下一步最关键的是把“看起来能运行”推进为“本地确实有一次任务落盘”。这能为后续真实 AI、资料读取、Skill 加载和审查流程提供稳定承载层。

### B. 前端继续完善任务体验

目标：

* 任务历史；
* 审查结果展示；
* 风险提示联动；
* 多章节选择；
* 导出入口优化。

也有价值，但更适合作为第二阶段之后的并行优化。如果继续只完善前端体验，BIDFORGE 会停留在更精致的 mock 工作台，仍然无法验证本地任务目录、运行记录、结果文件和后续 Runner 替换路径。

## 7. 推荐下一阶段

推荐第二阶段方向：

```text
A. Node/Express 本地 Runner 雏形
```

### 7.1 推荐理由

* 第一阶段前端闭环已经完成，继续只做 UI 的边际收益下降；
* BIDFORGE 的核心目标是本地 AI 标书工作台，必须尽早验证本地任务落盘；
* Node/Express 雏形可以先不接真实 AI，风险可控；
* 一旦 `/api/runs` 跑通，后续真实 AI、文件解析、Skill 读取、审查报告和导出都可以逐步挂接；
* 前端已有 `runnerApi` 层，替换为 HTTP API 的改动范围较小。

### 7.2 第一批要新增/修改的文件

建议新增：

| 文件 | 作用 |
| ---- | ---- |
| `server/index.ts` 或 `server/index.js` | 启动本地 Express 服务。 |
| `server/routes/runs.ts` | 提供 `POST /api/runs` 接口。 |
| `server/services/mockRunner.ts` | 创建本地 run 目录，写入任务文件并返回 Markdown。 |
| `server/types/run.ts` | 定义后端 run 输入、输出、状态和文件路径结构。 |
| `runs/.gitkeep` 或不提交真实 runs | 预留运行输出目录；真实 run 文件可加入 gitignore。 |

建议修改：

| 文件 | 作用 |
| ---- | ---- |
| `package.json` | 增加本地服务启动脚本和必要依赖。 |
| `src/services/runnerApi.ts` | 从 mock Promise 改为调用 `POST /api/runs`，并保留 fallback 或 mock 模式。 |
| `src/types/runner.ts` | 与后端返回结构保持一致。 |

### 7.3 第二阶段完成标准

第二阶段完成应满足：

1. 用户仍可在前台选择 `5.1 建筑设计`；
2. 用户点击 `生成精简稿` 后，前端请求本地 `POST /api/runs`；
3. 后端创建一次本地 run 目录；
4. 后端写入 `task.json`、`prompt.md`、`draft.md`、`auditor_result.md`；
5. 前端收到后端返回的 Markdown 并正常预览；
6. 前端状态仍能显示 running / success / failed；
7. Markdown 仍可通过导出入口下载；
8. 本阶段仍不接真实 AI、不解析 PDF/DOCX、不加载真实 Skill、不做 Word 导出、不进入 Production / Production RC。
