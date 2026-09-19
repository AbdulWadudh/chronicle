import type { ReactNode } from "react";
import { GlowBackdrop } from "~/components/common/GlowBackdrop";

export const CONTENT_MAX_WIDTH = 380;
export const WIDE_MAX_WIDTH = 1040;

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  wide?: boolean;
}

export function Screen({ children, scroll = false, center = false, wide = false }: ScreenProps) {
  const maxWidth = wide ? WIDE_MAX_WIDTH : CONTENT_MAX_WIDTH;

  const inner = (
    <div
      style={{ width: "100%", maxWidth }}
      className={`flex flex-1 flex-col self-center ${center ? "justify-center" : ""}`}
    >
      {children}
    </div>
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-canvas pt-[var(--safe-top)] pb-[var(--safe-bottom)] pl-[var(--safe-left)] pr-[var(--safe-right)]">
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
