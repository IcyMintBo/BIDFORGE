export type ProjectFileType = "PDF" | "DOCX" | "XLSX";

export interface ProjectFile {
  id: string;
  name: string;
  type: ProjectFileType;
  size: string;
  date: string;
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
    name: "绵阳高新区重卡智能制造产业园基础设施项目",
    code: "BIDFORGE-MVP-001",
    status: "进行中",
    files: [
      { id: "file-1", name: "01_招标文件.pdf", type: "PDF", size: "1.2 MB", date: "06-10" },
      { id: "file-2", name: "02_投标文件大纲.docx", type: "DOCX", size: "0.8 MB", date: "06-10" },
      { id: "file-3", name: "03_评分标准.xlsx", type: "XLSX", size: "0.6 MB", date: "06-10" },
      { id: "file-4", name: "04_候选精简稿.docx", type: "DOCX", size: "1.1 MB", date: "06-10" },
    ] satisfies ProjectFile[],
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
      "当前为第一阶段 MVP 演示草稿。选择章节并点击“生成精简稿”后，前台将调用 mock runner 返回 Markdown，并在此处预览结果。",
      "本阶段不接真实 AI Runner，不读取本地文件系统，不写入 runs 目录，也不进入 Production 或 Production RC。",
    ],
    wordCount: "0",
    autosaveTime: "未生成",
    version: "mvp-mock",
    spellStatus: "待生成",
  },
  assistant: {
    message: "第一阶段 MVP 已准备接入 mock runner，可先验证生成、预览和下载闭环。",
    actions: ["生成精简稿", "查看状态", "下载 Markdown"],
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
    autosave: "mock runner 待触发",
    fileCount: 4,
    chapterCount: 18,
    riskCount: 2,
    time: "10:24",
    date: "2026/06/10",
  },
};
