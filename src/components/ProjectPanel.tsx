import { FilePlus2, Folder } from "lucide-react";
import type { ProjectFile } from "../data/mockData";
import { PixelButton } from "./PixelButton";
import { RetroWindow } from "./RetroWindow";

interface ProjectPanelProps {
  project: {
    name: string;
    code: string;
    status: string;
    files: ProjectFile[];
  };
  onClose?: () => void;
}

const fileTypeClasses: Record<ProjectFile["type"], string> = {
  PDF: "bg-[#f64d45] text-white",
  DOCX: "bg-[#3b7ddb] text-white",
  XLSX: "bg-[#219c5c] text-white",
};

export function ProjectPanel({ project, onClose }: ProjectPanelProps) {
  return (
    <RetroWindow title="项目文件" className="project-panel" onClose={onClose}>
      <div className="project-heading">
        <div className="project-folder">
          <Folder size={30} fill="#feeaa4" strokeWidth={2.6} />
        </div>
        <div className="min-w-0 flex-1">
          <h3>{project.name}</h3>
          <p>项目编号：{project.code}</p>
        </div>
        <span className="status-pill green">{project.status}</span>
      </div>

      <div className="file-list">
        {project.files.map((file) => (
          <div className="file-row" key={file.id}>
            <span className={`file-type ${fileTypeClasses[file.type]}`}>{file.type === "PDF" ? "PDF" : file.type === "DOCX" ? "W" : "X"}</span>
            <span className="file-name">{file.name}</span>
            <span className="file-size">{file.size}</span>
            <span className="file-date">{file.date}</span>
          </div>
        ))}
      </div>

      <PixelButton icon={<FilePlus2 size={18} strokeWidth={2.8} />} variant="yellow">
        添加文件
      </PixelButton>
    </RetroWindow>
  );
}
