import { useState } from "react";
import { FileText, Sparkles, X } from "lucide-react";

interface MaterialsArrangeDialogProps {
  isRefining?: boolean;
  onCancel: () => void;
  onLocalArrange: () => void;
  onAiRefine: () => void;
}

export function MaterialsArrangeDialog({
  isRefining = false,
  onAiRefine,
  onCancel,
  onLocalArrange,
}: MaterialsArrangeDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<"local" | "ai">("local");

  function confirmSelection() {
    if (selectedMethod === "ai") {
      onAiRefine();
      return;
    }

    onLocalArrange();
  }

  return (
    <div className="forge-confirm-overlay" role="presentation">
      <section aria-labelledby="materials-arrange-title" aria-modal="true" className="forge-confirm-dialog materials-arrange-dialog" role="dialog">
        <header className="forge-confirm-titlebar">
          <span className="forge-confirm-icon" aria-hidden="true">
            <FileText size={25} />
          </span>
          <div>
            <small>Project Materials</small>
            <h2 id="materials-arrange-title">选择整理方式</h2>
          </div>
          <button aria-label="关闭资料整理弹窗" className="forge-confirm-close" onClick={onCancel} type="button">
            <X size={20} />
          </button>
        </header>

        <div className="forge-confirm-body materials-arrange-body">
          <button
            aria-pressed={selectedMethod === "local"}
            className={`materials-choice-card${selectedMethod === "local" ? " selected" : ""}`}
            onClick={() => setSelectedMethod("local")}
            type="button"
          >
            <FileText size={28} />
            <span>
              <strong>本地整理</strong>
              <small>不调用 API，生成基础资料包，适合快速检查和轻量写作。</small>
            </span>
          </button>
          <button
            aria-pressed={selectedMethod === "ai"}
            className={`materials-choice-card ai${selectedMethod === "ai" ? " selected" : ""}`}
            disabled={isRefining}
            onClick={() => setSelectedMethod("ai")}
            type="button"
          >
            <Sparkles size={28} />
            <span>
              <strong>{isRefining ? "精炼中……" : "大模型精炼"}</strong>
              <small>调用已配置 API，生成更完整、更适合写稿的资料包。</small>
            </span>
          </button>
        </div>

        <footer className="forge-confirm-actions">
          <button className="forge-confirm-primary" disabled={isRefining} onClick={confirmSelection} type="button">
            确定
          </button>
          <button className="forge-confirm-secondary" onClick={onCancel} type="button">
            取消
          </button>
        </footer>
      </section>
    </div>
  );
}
