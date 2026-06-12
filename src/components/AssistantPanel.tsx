import { Send } from "lucide-react";
import iconComputer from "../../icon_computer.png";
import { PixelButton } from "./PixelButton";
import { RetroWindow } from "./RetroWindow";

interface AssistantPanelProps {
  assistant: {
    message: string;
    actions: string[];
  };
}

export function AssistantPanel({ assistant }: AssistantPanelProps) {
  return (
    <RetroWindow title="AI 助手 · ForgeBot" className="assistant-panel" bodyClassName="assistant-body">
      <div className="bot-avatar">
        <img alt="" src={iconComputer} />
        <strong>B</strong>
      </div>
      <div className="assistant-bubble">{assistant.message}</div>
      <div className="assistant-actions">
        {assistant.actions.map((action) => (
          <PixelButton key={action} variant="pink">
            {action}
          </PixelButton>
        ))}
      </div>
      <div className="assistant-input">
        <input aria-label="输入你的问题" placeholder="输入你的问题..." />
        <button aria-label="发送" type="button">
          <Send size={22} fill="#12100f" />
        </button>
      </div>
    </RetroWindow>
  );
}
