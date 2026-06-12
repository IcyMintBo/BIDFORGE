import type { ChapterProgress } from "../data/mockData";
import type { RunnerTaskStatus } from "../types/runner";
import { RetroWindow } from "./RetroWindow";

interface ChapterProgressPanelProps {
  chapters: ChapterProgress[];
  onClose?: () => void;
  selectedSectionId: string;
  taskStatus: RunnerTaskStatus;
  onSelectSection: (sectionId: string) => void;
}

const statusClass: Record<ChapterProgress["status"], string> = {
  已完成: "green",
  生成中: "yellow",
  待审查: "pink",
};

function getRuntimeStatus(chapter: ChapterProgress, selectedSectionId: string, taskStatus: RunnerTaskStatus) {
  if (chapter.id !== selectedSectionId) {
    return {
      label: chapter.status,
      className: statusClass[chapter.status],
      progress: chapter.progress,
    };
  }

  if (taskStatus === "running") {
    return { label: "生成中", className: "yellow", progress: 65 };
  }

  if (taskStatus === "success") {
    return { label: "生成完成", className: "green", progress: 100 };
  }

  if (taskStatus === "failed") {
    return { label: "生成失败", className: "pink", progress: 0 };
  }

  return {
    label: chapter.status,
    className: statusClass[chapter.status],
    progress: chapter.progress,
  };
}

export function ChapterProgressPanel({
  chapters,
  onClose,
  onSelectSection,
  selectedSectionId,
  taskStatus,
}: ChapterProgressPanelProps) {
  return (
    <RetroWindow title="章节进度" className="chapter-panel" onClose={onClose}>
      <div className="chapter-table-head">
        <span>章节</span>
        <span>状态</span>
        <span>进度</span>
      </div>
      <div className="chapter-list">
        {chapters.map((chapter) => {
          const runtimeStatus = getRuntimeStatus(chapter, selectedSectionId, taskStatus);

          return (
            <button
              className={`chapter-row chapter-row-button ${chapter.id === selectedSectionId ? "selected" : ""}`}
              key={chapter.id}
              onClick={() => onSelectSection(chapter.id)}
              type="button"
            >
              <span className="chapter-id">{chapter.id}</span>
              <strong>{chapter.title}</strong>
              <span className={`status-pill ${runtimeStatus.className}`}>{runtimeStatus.label}</span>
              <div className="chapter-progress">
                <i style={{ width: `${runtimeStatus.progress}%` }} />
              </div>
              <b>{runtimeStatus.progress}%</b>
            </button>
          );
        })}
      </div>
      <div className="overall-progress">
        <strong>总进度</strong>
        <div className="segment-progress" aria-label="总进度 72%">
          {Array.from({ length: 18 }).map((_, index) => (
            <span className={index < 13 ? "filled" : ""} key={index} />
          ))}
        </div>
        <b>72%</b>
      </div>
    </RetroWindow>
  );
}
