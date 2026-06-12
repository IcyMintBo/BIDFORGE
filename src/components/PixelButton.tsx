import type { ButtonHTMLAttributes, ReactNode } from "react";

type PixelButtonVariant = "default" | "pink" | "green" | "yellow" | "plain";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  variant?: PixelButtonVariant;
  wide?: boolean;
}

const variantClasses: Record<PixelButtonVariant, string> = {
  default: "bg-paper hover:bg-butter",
  pink: "bg-blush hover:bg-pink-200",
  green: "bg-mint hover:bg-lime-200",
  yellow: "bg-butter hover:bg-yellow-200",
  plain: "bg-white/80 hover:bg-paper",
};

export function PixelButton({
  children,
  icon,
  variant = "default",
  wide = false,
  className = "",
  ...props
}: PixelButtonProps) {
  return (
    <button
      className={[
        "pixel-button inline-flex items-center justify-center gap-2 rounded-md border-2 border-ink px-3 py-2 text-sm font-black text-ink shadow-[2px_2px_0_#12100f] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
        variantClasses[variant],
        wide ? "w-full" : "",
        className,
      ].join(" ")}
      type="button"
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
