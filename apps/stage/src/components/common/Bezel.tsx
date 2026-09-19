import type { ReactNode } from "react";

export interface BezelProps {
  children: ReactNode;
  tone?: "default" | "raised";
}

const RAISED_SHADOW = "0 18px 28px rgb(0 0 0 / 0.55)";
const INNER_SHADOW = "0 1px 1px rgb(255 255 255 / 0.06)";

export function Bezel({ children, tone = "default" }: BezelProps) {
  return (
    <div
      className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-1"
      style={tone === "raised" ? { boxShadow: RAISED_SHADOW } : undefined}
    >
      <div
        className="overflow-hidden rounded-[18px] border border-white/[0.05] bg-card"
        style={{ boxShadow: INNER_SHADOW }}
      >
        {children}
      </div>
    </div>
  );
}
