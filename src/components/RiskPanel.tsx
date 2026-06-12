import { AlertTriangle, ChevronRight } from "lucide-react";
import type { RiskItem } from "../data/mockData";
import { PixelButton } from "./PixelButton";
import { RetroWindow } from "./RetroWindow";

interface RiskPanelProps {
  risks: RiskItem[];
  onClose?: () => void;
}

const levelClass: Record<RiskItem["level"], string> = {
  高风险: "pink",
  中风险: "yellow",
};

export function RiskPanel({ risks, onClose }: RiskPanelProps) {
  return (
    <RetroWindow title="风险预警" className="risk-panel" onClose={onClose}>
      <div className="risk-list">
        {risks.map((risk) => (
          <div className="risk-row" key={risk.id}>
            <AlertTriangle size={25} fill={risk.level === "高风险" ? "#ff8fae" : "#feeaa4"} strokeWidth={2.4} />
            <strong>{risk.title}</strong>
            <span className={`status-pill ${levelClass[risk.level]}`}>{risk.level}</span>
          </div>
        ))}
      </div>
      <PixelButton icon={<ChevronRight size={18} />} variant="yellow" wide>
        查看全部风险（{risks.length}）
      </PixelButton>
    </RetroWindow>
  );
}
