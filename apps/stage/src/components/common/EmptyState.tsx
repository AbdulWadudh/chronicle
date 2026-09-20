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
      <div className="flex h-14 w-14 items-center justify-center rounded-card border-(length:--border-width-card) border-hairline bg-raised-hover">
        <HugeiconsIcon icon={icon} size={22} strokeWidth={1.25} color={tokens.textMuted} />
      </div>
      <p className="text-center text-[0.9375rem] font-medium text-text-secondary">{title}</p>
      {body !== undefined ? (
        <p className="max-w-75 text-center text-[0.8125rem] leading-relaxed text-text-muted">
          {body}
        </p>
      ) : null}
    </div>
  );
}
