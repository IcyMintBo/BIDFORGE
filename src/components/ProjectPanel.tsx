import { useRef, type ChangeEvent } from "react";
import { CheckSquare, FilePlus2, FileText, Folder, FolderOpen, RefreshCw, Trash2 } from "lucide-react";
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
  isUploading?: boolean;
  isBuildingMaterials?: boolean;
  isMaterialsConfirmed?: boolean;
  uploadMessage?: string;
  onAddFiles?: (files: File[]) => void;
  onBuildMaterials?: () => void;
  onConfirmMaterials?: () => void;
  onDeleteFile?: (fileId: string) => void;
  onOpenFolder?: () => void;
  onOpenMaterialsFolder?: () => void;
  onRefreshFiles?: () => void;
}

const fileTypeClasses: Record<ProjectFile["type"], string> = {
  PDF: "bg-[#f64d45] text-white",
  DOCX: "bg-[#3b7ddb] text-white",
  XLSX: "bg-[#219c5c] text-white",
  MD: "bg-[#7f65d9] text-white",
  TXT: "bg-[#8a7b5b] text-white",
  OTHER: "bg-[#feeaa4] text-ink",
};

function getFileTypeLabel(type: ProjectFile["type"]) {
  if (type === "PDF") return "PDF";
  if (type === "DOCX") return "W";
  if (type === "XLSX") return "X";
  if (type === "MD") return "MD";
  if (type === "TXT") return "TXT";
  return "FILE";
}

export function ProjectPanel({
  project,
  onAddFiles,
  onBuildMaterials,
  onConfirmMaterials,
  onClose,
  onDeleteFile,
  onOpenFolder,
  onOpenMaterialsFolder,
  onRefreshFiles,
  isBuildingMaterials = false,
  isMaterialsConfirmed = false,
  isUploading = false,
  uploadMessage,
}: ProjectPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      onAddFiles?.(files);
    }
    event.target.value = "";
  }

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
        {project.files.length > 0 ? (
          project.files.map((file) => (
            <div className="file-row" key={file.id}>
              <span className={`file-type ${fileTypeClasses[file.type]}`}>{getFileTypeLabel(file.type)}</span>
              <span className="file-name" title={file.path ?? file.name}>
                {file.name}
              </span>
              <span className="file-size">{file.size}</span>
              <span className="file-date">{file.date}</span>
              <button
                aria-label={`删除 ${file.name}`}
                className="file-delete-button"
                onClick={() => onDeleteFile?.(file.id)}
                title="删除文件"
                type="button"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        ) : (
          <div className="project-empty-state">
            <strong>还没有项目文件</strong>
            <span>点击“添加文件”，或把文件放入 input_files 后点击“刷新”。</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.md,.txt"
        className="sr-only"
        multiple
        onChange={handleFileChange}
        type="file"
      />
      <div className="project-file-actions">
        <PixelButton disabled={isUploading} icon={<FilePlus2 size={18} strokeWidth={2.8} />} onClick={openFilePicker} variant="yellow">
          {isUploading ? "上传中……" : "添加文件"}
        </PixelButton>
        <button aria-label="打开文件夹" className="project-icon-action" onClick={onOpenFolder} title="打开文件夹" type="button">
          <FolderOpen size={18} strokeWidth={2.8} />
        </button>
        <button aria-label="刷新文件列表" className="project-icon-action" onClick={onRefreshFiles} title="刷新" type="button">
          <RefreshCw size={18} strokeWidth={2.8} />
        </button>
      </div>
      <div className="project-materials-actions">
        <PixelButton
          className="project-materials-button"
          disabled={isUploading || isBuildingMaterials}
          icon={<FileText size={18} strokeWidth={2.8} />}
          onClick={onBuildMaterials}
          variant="green"
          wide
        >
          {isBuildingMaterials ? "整理中……" : "整理资料"}
        </PixelButton>
        <button
          aria-label="打开资料文件夹"
          className="project-icon-action"
          onClick={onOpenMaterialsFolder}
          title="打开资料文件夹"
          type="button"
        >
          <FolderOpen size={18} strokeWidth={2.8} />
        </button>
      </div>
      <PixelButton
        className={`project-confirm-materials-button${isMaterialsConfirmed ? " confirmed" : ""}`}
        disabled={isBuildingMaterials || isMaterialsConfirmed}
        icon={<CheckSquare size={18} strokeWidth={2.8} />}
        onClick={onConfirmMaterials}
        variant={isMaterialsConfirmed ? "green" : "plain"}
        wide
      >
        {isMaterialsConfirmed ? "资料已确认" : "确认资料可用于生成"}
      </PixelButton>
      {uploadMessage ? <p className="project-upload-message">{uploadMessage}</p> : null}
    </RetroWindow>
  );
}
