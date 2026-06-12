import { AlertTriangle, FileText, FolderOpen, ShieldCheck, Upload } from "lucide-react";
import heroBackground from "../../back2.png";
import type { WorkspaceTool } from "../types/workspace";
import { ShortcutCard } from "./ShortcutCard";

const shortcuts = [
  {
    tool: "project" as const,
    title: "项目文件",
    subtitle: "查看与管理文件",
    icon: <FolderOpen size={30} strokeWidth={2.6} />,
    tone: "green" as const,
  },
  {
    tool: "chapters" as const,
    title: "标书章节",
    subtitle: "章节结构与进度",
    icon: <FileText size={30} strokeWidth={2.6} />,
    tone: "yellow" as const,
  },
  {
    tool: "quality" as const,
    title: "质量检查",
    subtitle: "检查标书质量",
    icon: <ShieldCheck size={30} strokeWidth={2.6} />,
    tone: "purple" as const,
  },
  {
    tool: "risks" as const,
    title: "风险预警",
    subtitle: "识别潜在风险",
    icon: <AlertTriangle size={30} strokeWidth={2.6} />,
    tone: "pink" as const,
  },
];

interface HeroBannerProps {
  activeTools: WorkspaceTool[];
  onOpenTool: (tool: WorkspaceTool) => void;
  onOpenExport: () => void;
}

export function HeroBanner({ activeTools, onOpenExport, onOpenTool }: HeroBannerProps) {
  return (
    <section className="hero-banner" style={{ backgroundImage: `url(${heroBackground})` }}>
      <div className="hero-copy">
        <h1>
          Hello.
          <br />
          Let's write this bid.
        </h1>
        <p>致力于成为一个通人性的标书生成软件，让页数、逻辑和合规性尽量同时存在。</p>
      </div>

      <div className="shortcut-grid">
        {shortcuts.map((shortcut) => (
          <ShortcutCard
            isActive={activeTools.includes(shortcut.tool)}
            key={shortcut.title}
            onClick={() => onOpenTool(shortcut.tool)}
            {...shortcut}
          />
        ))}
        <ShortcutCard
          icon={<Upload size={30} strokeWidth={2.6} />}
          onClick={onOpenExport}
          subtitle="当前章节 / 全文 / 格式"
          title="导出文档"
          tone="yellow"
        />
      </div>
    </section>
  );
}
