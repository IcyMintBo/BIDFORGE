import { useState } from "react";
import { Download, FileDown, FileText, FolderOpen, Star, X } from "lucide-react";
import type { RunnerTaskResult, RunnerTaskStatus } from "../types/runner";

type ExportScope = "current_section" | "full_document";
type ExportFormat = "md" | "docx";

interface ExportDialogProps {
  currentSectionLabel: string;
  result?: RunnerTaskResult;
  taskStatus: RunnerTaskStatus;
  onClose: () => void;
  onExportMarkdown: () => void;
}

export function ExportDialog({ currentSectionLabel, result, taskStatus, onClose, onExportMarkdown }: ExportDialogProps) {
  const [scope, setScope] = useState<ExportScope>("current_section");
  const [format, setFormat] = useState<ExportFormat>("md");
  const canExportCurrentMarkdown = Boolean(result) && taskStatus === "success";
  const canRunExport = scope === "current_section" && format === "md" && canExportCurrentMarkdown;

  return (
    <div className="export-overlay" role="presentation">
      <section aria-label="导出文档" className="export-dialog">
        <header className="export-titlebar">
          <span className="export-title-icon">
            <FileDown size={27} />
          </span>
          <h2>导出文档</h2>
          <button aria-label="关闭导出面板" className="export-close-button" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </header>

        <p className="export-description">当前版本支持导出当前章节 Markdown，适合预览、归档和继续编辑。</p>

        <div className="export-picker-grid">
          <section className="export-picker-panel" aria-label="导出范围">
            <h3>导出范围</h3>
            <button
              className={`export-picker-card ${scope === "current_section" ? "selected" : ""}`}
              onClick={() => setScope("current_section")}
              type="button"
            >
              {scope === "current_section" ? (
                <span className="export-star" aria-hidden="true">
                  <Star color="#12100f" fill="#ffe76f" size={32} strokeWidth={2.8} />
                </span>
              ) : null}
              <span className="export-card-icon">
                <FileText size={35} />
              </span>
              <span className="export-card-copy">
                <strong>当前章节</strong>
                <small>{currentSectionLabel}</small>
              </span>
            </button>

            <button className="export-picker-card disabled" disabled type="button">
              <span className="export-card-icon">
                <FolderOpen size={35} />
              </span>
              <span className="export-card-copy">
                <strong>整个文档</strong>
                <small>即将支持</small>
              </span>
            </button>
          </section>

          <section className="export-picker-panel" aria-label="导出格式">
            <h3>导出格式</h3>
            <button className={`export-picker-card ${format === "md" ? "selected" : ""}`} onClick={() => setFormat("md")} type="button">
              {format === "md" ? (
                <span className="export-star" aria-hidden="true">
                  <Star color="#12100f" fill="#ffe76f" size={32} strokeWidth={2.8} />
                </span>
              ) : null}
              <span className="export-card-icon">
                <FileText size={35} />
              </span>
              <span className="export-card-copy">
                <strong>Markdown (.md)</strong>
                <small>当前阶段可用</small>
              </span>
            </button>

            <button className="export-picker-card disabled" disabled type="button">
              <span className="export-card-icon">
                <FileText size={35} />
              </span>
              <span className="export-card-copy">
                <strong>Word (.docx)</strong>
                <small>即将支持</small>
              </span>
            </button>
          </section>
        </div>

        <div className="export-note">
          <span className="export-note-icon">
            <FileText size={23} />
          </span>
          <span>{canExportCurrentMarkdown ? "已生成当前章节草稿，可以导出 Markdown。" : "请先生成当前章节草稿，完成后即可导出 Markdown。"}</span>
        </div>

        <footer className="export-actions">
          <button className="export-secondary-button" onClick={onClose} type="button">
            取消
          </button>
          <button className="export-primary-button" disabled={!canRunExport} onClick={onExportMarkdown} type="button">
            <Download size={22} />
            导出当前章节 Markdown
          </button>
        </footer>
      </section>
    </div>
  );
}
