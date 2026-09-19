import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useThemeTokens } from "~/theme/ThemeEngine";

export interface EmptyStateProps {
  icon: IconSvgElement;
  title: string;
  body?: string;
  compact?: boolean;
}

export function EmptyState({ icon, title, body, compact = false }: EmptyStateProps) {
  const tokens = useThemeTokens();

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${compact ? "px-6 py-10" : "flex-1 px-8"}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
        <HugeiconsIcon icon={icon} size={22} strokeWidth={1.25} color={tokens.textMuted} />
      </div>
      <p className="text-center text-[15px] font-medium text-text-secondary">{title}</p>
      {body !== undefined ? (
        <p className="max-w-[300px] text-center text-[13px] leading-relaxed text-text-muted">
          {body}
        </p>
      ) : null}
    </div>
  );
}
