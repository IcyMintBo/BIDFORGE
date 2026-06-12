import { AlertTriangle, BatteryFull, FileText, Layers3, Volume2, Wifi } from "lucide-react";
import iconComputer from "../../icon_computer.png";

interface BottomStatusBarProps {
  status: {
    workspace: string;
    currentProject: string;
    autosave: string;
    fileCount: number;
    chapterCount: number;
    riskCount: number;
    time: string;
  };
}

export function BottomStatusBar({ status }: BottomStatusBarProps) {
  return (
    <footer className="bottom-statusbar">
      <div className="task-chip">
        <img alt="" src={iconComputer} />
        <strong>{status.workspace}</strong>
      </div>
      <span className="status-dot-text">项目：{status.currentProject}</span>
      <span className="status-dot-text">{status.autosave}</span>
      <span>
        <FileText size={17} /> 文件：{status.fileCount}
      </span>
      <span>
        <Layers3 size={17} /> 章节：{status.chapterCount}
      </span>
      <span>
        <AlertTriangle size={17} /> 风险：{status.riskCount}
      </span>
      <div className="system-icons">
        <Volume2 size={21} />
        <Wifi size={21} />
        <BatteryFull size={24} />
      </div>
      <strong className="clock">{status.time}</strong>
    </footer>
  );
}
