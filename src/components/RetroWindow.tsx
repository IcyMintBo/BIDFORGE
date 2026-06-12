import type { ReactNode } from "react";

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  onClose?: () => void;
}

export function RetroWindow({
  title,
  children,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  onClose,
}: RetroWindowProps) {
  const controls = (
    <>
      <span className="bg-mint" />
      <span className="bg-butter" />
      <span className="bg-blush" />
    </>
  );

  return (
    <section className={`retro-window ${className}`}>
      <div className={`window-titlebar ${headerClassName}`}>
        <h2>{title}</h2>
        {onClose ? (
          <button className="window-controls window-close-button" aria-label={`关闭${title}`} onClick={onClose} type="button">
            {controls}
          </button>
        ) : (
          <div className="window-controls" aria-hidden="true">
            {controls}
          </div>
        )}
      </div>
      <div className={`window-body ${bodyClassName}`}>{children}</div>
    </section>
  );
}
