import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface ShortcutCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone: "green" | "yellow" | "pink" | "purple";
  isActive?: boolean;
  onClick?: () => void;
}

const toneClasses = {
  green: "bg-[#f3ffd9]",
  yellow: "bg-[#fff1b8]",
  pink: "bg-[#ffe1ef]",
  purple: "bg-[#ead9ff]",
};

export function ShortcutCard({ icon, title, subtitle, tone, isActive = false, onClick }: ShortcutCardProps) {
  return (
    <button className={`shortcut-card ${toneClasses[tone]} ${isActive ? "active" : ""}`} onClick={onClick} type="button">
      <span className="shortcut-icon">{icon}</span>
      <span className="min-w-0 flex-1 text-left">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <ArrowRight size={22} strokeWidth={2.8} />
    </button>
  );
}
