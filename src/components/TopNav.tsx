import { useEffect, useState } from "react";
import iconCompliance from "../../icon_compliance_check.png";
import iconComputer from "../../icon_computer.png";
import iconNewDocument from "../../icon_new_document.png";
import iconReview from "../../icon_review_clipboard.png";
import iconSettings from "../../icon_settings_gear.png";
import iconTime from "../../icon_time.png";
import iconWorkbench from "../../icon_workbench_folder1.png";
import textLogo from "../../text.png";
import type { SystemPanelKind } from "./SystemPanelDialog";

interface TopNavProps {
  time: string;
  date: string;
  onOpenSystemPanel: (kind: SystemPanelKind) => void;
}

const navItems: Array<{ label: string; icon: string; panel: SystemPanelKind }> = [
  { label: "新建任务", icon: iconNewDocument, panel: "new-task" },
  { label: "API 接口", icon: iconReview, panel: "api" },
  { label: "本地 Runner", icon: iconWorkbench, panel: "runner" },
  { label: "设置", icon: iconSettings, panel: "settings" },
  { label: "合规检查", icon: iconCompliance, panel: "compliance" },
];

const tickerMessages = [
  "别装，我知道你想直接导出",
  "又想糊弄过去，是吧",
  "你但凡自己读一遍呢？",
  "这里不是许愿池",
  "页数有了，合规性暂时还没有",
];

export function TopNav({ time, date, onOpenSystemPanel }: TopNavProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  const currentMessage = tickerMessages[messageIndex];
  const displayedMessage = currentMessage.slice(0, visibleChars);

  useEffect(() => {
    if (visibleChars < currentMessage.length) {
      const timer = window.setTimeout(() => {
        setVisibleChars((count) => count + 1);
      }, 200);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setMessageIndex((index) => (index + 1) % tickerMessages.length);
      setVisibleChars(0);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [currentMessage.length, visibleChars]);

  return (
    <header className="top-nav">
      <div className="brand-block">
        <img alt="" className="brand-icon" src={iconComputer} />
        <div className="brand-copy">
          <img alt="BIDFORGE" className="brand-logo-text" src={textLogo} />
          <div className="brand-ticker" aria-label="BIDFORGE 滚动说明">
            <span>{displayedMessage}</span>
          </div>
        </div>
      </div>

      <div className="toolbar-divider" aria-hidden="true" />

      <nav className="nav-buttons system-nav-buttons" aria-label="BIDFORGE 系统工具栏">
        {navItems.map((item) => (
          <button className="nav-tool" key={item.label} onClick={() => onOpenSystemPanel(item.panel)} type="button">
            <img alt="" src={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="time-card" aria-label={`当前时间 ${time} ${date}`}>
        <img alt="" className="time-card-art" src={iconTime} />
        <div className="time-card-display">
          <strong>{time}</strong>
          <span>{date}</span>
        </div>
      </div>
    </header>
  );
}
