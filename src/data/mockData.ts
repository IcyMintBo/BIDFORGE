export type ProjectFileType = "PDF" | "DOCX" | "XLSX" | "MD" | "TXT" | "OTHER";

export interface ProjectFile {
  id: string;
  name: string;
  type: ProjectFileType;
  size: string;
  date: string;
  bytes?: number;
  path?: string;
  status?: string;
  uploadedAt?: string;
}

export interface QualityMetric {
  label: string;
  score: number;
  max: number;
}

export interface ChapterProgress {
  id: string;
  title: string;
  status: "已完成" | "生成中" | "待审查";
  progress: number;
}

export interface RiskItem {
  id: string;
  level: "高风险" | "中风险";
  title: string;
}

export const mockData = {
  project: {
    id: "bidforge-demo-project",
    name: "当前项目工作区",
    code: "BIDFORGE-LOCAL",
    status: "进行中",
    files: [] satisfies ProjectFile[],
  },
  quality: {
    score: 86,
    status: "良好",
    metrics: [
      { label: "招标响应性", score: 18, max: 20 },
      { label: "项目贴合度", score: 16, max: 20 },
      { label: "专业完整度", score: 17, max: 20 },
      { label: "风险控制", score: 14, max: 15 },
    ] satisfies QualityMetric[],
  },
  draft: {
    section: "5.1 建筑设计",
    paragraphs: [
      "当前支持 Direct Forge 与 Agent Pack 两种前台模式。Direct Forge 会在用户确认后调用本机配置的 API，Agent Pack 会生成可交给外部 Agent 执行的任务包。",
      "请选择章节和模式后点击生成，结果将在此处预览。当前仍不进入 Production 或 Production RC。",
    ],
    wordCount: "0",
    autosaveTime: "未生成",
    version: "mvp-mock",
    spellStatus: "待生成",
  },
  assistant: {
    message: "Direct Forge / Agent Pack 已就绪，可先生成任务包，或配置 API 后进行单小节真实生成。",
    actions: ["生成任务包", "配置 API", "读取结果"],
  },
  chapters: [
    { id: "1.1", title: "工程概述", status: "已完成", progress: 100 },
    { id: "1.2", title: "功能定位", status: "已完成", progress: 100 },
    { id: "1.3", title: "建设条件", status: "已完成", progress: 100 },
    { id: "1.4", title: "设计理念", status: "待审查", progress: 65 },
    { id: "5.1", title: "建筑设计", status: "待审查", progress: 0 },
  ] satisfies ChapterProgress[],
  risks: [
    { id: "risk-1", level: "高风险", title: "存在扩大服务范围表述" },
    { id: "risk-2", level: "中风险", title: "部分表达可能过度承诺" },
  ] satisfies RiskItem[],
  statusBar: {
    workspace: "BIDFORGE 工作台",
    currentProject: "绵阳高新区重卡智能制造产业园基础设施项目",
    autosave: "等待生成",
    fileCount: 4,
    chapterCount: 18,
    riskCount: 2,
    time: "10:24",
    date: "2026/06/10",
  },
};
