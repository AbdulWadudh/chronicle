import type { ReactNode } from "react";

export interface BezelProps {
  children: ReactNode;
  tone?: "default" | "raised";
}

export function Bezel({ children, tone = "default" }: BezelProps) {
  return (
    <div
      className="rounded-card border-(length:--border-width-card) border-hairline bg-raised p-1"
      style={tone === "raised" ? { boxShadow: "var(--shadow-overlay)" } : undefined}
    >
      <div className="overflow-hidden rounded-card border-(length:--border-width-card) border-hairline bg-card">
        {children}
      </div>
    </div>
  );
}
