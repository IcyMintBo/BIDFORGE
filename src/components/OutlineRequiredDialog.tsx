import { FilePlus2, Sparkles, X } from "lucide-react";

interface OutlineRequiredDialogProps {
  isGenerating?: boolean;
  onCancel: () => void;
  onGenerateOutline: () => void;
  onUploadOutline: () => void;
}

export function OutlineRequiredDialog({
  isGenerating = false,
  onCancel,
  onGenerateOutline,
  onUploadOutline,
}: OutlineRequiredDialogProps) {
  return (
    <div className="forge-confirm-overlay" role="presentation">
      <section aria-labelledby="outline-required-title" aria-modal="true" className="forge-confirm-dialog outline-required-dialog" role="dialog">
        <header className="forge-confirm-titlebar">
          <span className="forge-confirm-icon" aria-hidden="true">
            <FilePlus2 size={25} />
          </span>
          <div>
            <small>Chapter Outline</small>
            <h2 id="outline-required-title">需要章节大纲</h2>
          </div>
          <button aria-label="关闭章节大纲弹窗" className="forge-confirm-close" onClick={onCancel} type="button">
            <X size={20} />
          </button>
        </header>

        <div className="forge-confirm-body">
          <div className="forge-confirm-card">
            <FilePlus2 size={26} />
            <p>BIDFORGE 需要先确认标书章节结构，才能进入后续写稿。</p>
          </div>
          <p className="forge-confirm-note">你可以上传已有大纲，也可以调用 API 生成一版建议大纲。</p>
        </div>

        <footer className="forge-confirm-actions outline-required-actions">
          <button className="forge-confirm-secondary" onClick={onUploadOutline} type="button">
            上传大纲文件
          </button>
          <button className="forge-confirm-primary" disabled={isGenerating} onClick={onGenerateOutline} type="button">
            <Sparkles size={17} />
            {isGenerating ? "生成中……" : "调用 API 生成"}
          </button>
          <button className="forge-confirm-secondary" onClick={onCancel} type="button">
            取消
          </button>
        </footer>
      </section>
    </div>
  );
}
