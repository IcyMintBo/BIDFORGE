import { CreditCard, Sparkles, X } from "lucide-react";

interface DirectForgeConfirmDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function DirectForgeConfirmDialog({ onCancel, onConfirm }: DirectForgeConfirmDialogProps) {
  return (
    <div className="forge-confirm-overlay" role="presentation">
      <section
        aria-labelledby="direct-forge-confirm-title"
        aria-modal="true"
        className="forge-confirm-dialog"
        role="dialog"
      >
        <header className="forge-confirm-titlebar">
          <span className="forge-confirm-icon" aria-hidden="true">
            <Sparkles size={25} />
          </span>
          <div>
            <small>Direct Forge</small>
            <h2 id="direct-forge-confirm-title">确认真实生成</h2>
          </div>
          <button aria-label="关闭确认弹窗" className="forge-confirm-close" onClick={onCancel} type="button">
            <X size={20} />
          </button>
        </header>

        <div className="forge-confirm-body">
          <div className="forge-confirm-card">
            <CreditCard size={26} />
            <p>本次将调用你当前配置的真实 API，可能产生费用。确认后 BIDFORGE 才会开始生成。</p>
          </div>
          <p className="forge-confirm-note">如果只是想生成任务包，请切换到 Agent Pack。</p>
        </div>

        <footer className="forge-confirm-actions">
          <button className="forge-confirm-primary" onClick={onConfirm} type="button">
            不差钱
          </button>
          <button className="forge-confirm-secondary" onClick={onCancel} type="button">
            取消
          </button>
        </footer>
      </section>
    </div>
  );
}
