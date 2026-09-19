import type { ReactNode } from "react";
import { GlowBackdrop } from "~/components/common/GlowBackdrop";

export type ScreenWidth = "narrow" | "wide" | "full";

const MAX_WIDTH: Record<ScreenWidth, string> = {
  narrow: "380px",
  wide: "1040px",
  full: "none",
};

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  width?: ScreenWidth;
}

export function Screen({
  children,
  scroll = false,
  center = false,
  width = "narrow",
}: ScreenProps) {
  const inner = (
    <div
      style={{ width: "100%", maxWidth: MAX_WIDTH[width] }}
      className={`flex min-h-0 flex-1 flex-col self-center ${center ? "justify-center" : ""}`}
    >
      {children}
    </div>
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-canvas pt-[var(--safe-top)] pr-[var(--safe-right)] pb-[var(--safe-bottom)] pl-[var(--safe-left)]">
      <GlowBackdrop />
      {scroll ? (
        <div className="scrollbar-none relative flex flex-1 flex-col overflow-y-auto px-5 py-6">
          {inner}
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col overflow-hidden px-5 py-6">{inner}</div>
      )}
    </div>
  );
}
