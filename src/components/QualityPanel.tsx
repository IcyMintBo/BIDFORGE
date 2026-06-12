import { ChevronRight } from "lucide-react";
import type { QualityMetric } from "../data/mockData";
import { PixelButton } from "./PixelButton";
import { RetroWindow } from "./RetroWindow";

interface QualityPanelProps {
  quality: {
    score: number;
    status: string;
    metrics: QualityMetric[];
  };
  onClose?: () => void;
}

export function QualityPanel({ quality, onClose }: QualityPanelProps) {
  return (
    <RetroWindow title="质量检查" className="quality-panel" onClose={onClose}>
      <div className="quality-score">
        <div>
          <strong>{quality.score}</strong>
          <span>/100</span>
        </div>
        <span className="status-pill green">{quality.status}</span>
      </div>

      <div className="quality-metrics">
        {quality.metrics.map((metric) => (
          <div className="metric-row" key={metric.label}>
            <span>{metric.label}</span>
            <div className="metric-track">
              <i style={{ width: `${(metric.score / metric.max) * 100}%` }} />
            </div>
            <b>
              {metric.score}/{metric.max}
            </b>
          </div>
        ))}
      </div>

      <PixelButton icon={<ChevronRight size={18} />} variant="yellow" wide>
        查看详细报告
      </PixelButton>
    </RetroWindow>
  );
}
