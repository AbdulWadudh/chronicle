import type { ThemeTokens } from "@chronicle/config";
import type { ThemePalette } from "@chronicle/utils";
import { ColorsIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "~/components/ui/button";

export function PaletteCard({
  palette,
  tokens,
  selected,
  index,
  onApply,
  onMerge,
}: {
  palette: ThemePalette;
  tokens: ThemeTokens;
  selected: boolean;
  index: number;
  onApply: () => void;
  onMerge: (() => void) | null;
}) {
  return (
    <div className="relative" style={{ ["--rise-index" as string]: index }}>
      <button
        type="button"
        onClick={onApply}
        aria-pressed={selected}
        className={`pressable rise-in flex w-full cursor-pointer flex-col gap-2 overflow-hidden rounded-(--radius-card) border-(length:--border-width-card) p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
          selected ? "border-primary bg-primary/[0.07]" : "border-hairline bg-raised"
        }`}
      >
        <span
          className="relative flex h-16 flex-col justify-between overflow-hidden rounded-(--radius-control) p-2"
          style={{ backgroundColor: tokens.canvas }}
        >
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-8 rounded-full"
              style={{ backgroundColor: tokens.primary }}
              aria-hidden="true"
            />
            <span
              className="h-2 w-4 rounded-full"
              style={{ backgroundColor: tokens.accent }}
              aria-hidden="true"
            />
          </span>
          <span
            className="flex flex-col gap-1 rounded-[6px] p-1.5"
            style={{
              backgroundColor: tokens.card,
              border: `${tokens.borderWidth}px solid ${tokens.cardBorder}`,
              boxShadow:
                tokens.shadowOffset === 0
                  ? "none"
                  : `${tokens.shadowOffset}px ${tokens.shadowOffset}px 0 0 ${tokens.shadowColor}`,
            }}
          >
            <span
              className="h-1 w-3/4 rounded-full"
              style={{ backgroundColor: tokens.textPrimary }}
              aria-hidden="true"
            />
            <span
              className="h-1 w-1/2 rounded-full"
              style={{ backgroundColor: tokens.textMuted }}
              aria-hidden="true"
            />
          </span>
        </span>

        <span className="flex items-start justify-between gap-2 px-0.5">
          <span className="min-w-0">
            <span className="block truncate text-[0.8125rem] font-medium text-text-primary">
              {palette.name}
            </span>
            <span className="mt-0.5 block line-clamp-2 text-[0.6875rem] leading-relaxed text-text-muted">
              {palette.blurb}
            </span>
          </span>
          {selected ? (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-(--radius-control) bg-primary text-primary-foreground">
              <HugeiconsIcon icon={Tick02Icon} size={10} strokeWidth={3} />
            </span>
          ) : null}
        </span>
      </button>

      {onMerge === null ? null : (
        <Button
          variant="outline"
          size="iconSm"
          aria-label={`Take parts of ${palette.name}`}
          title={`Take parts of ${palette.name}`}
          onClick={onMerge}
          className="absolute top-3.5 right-3.5 rounded-(--radius-control) bg-card"
        >
          <HugeiconsIcon icon={ColorsIcon} size={13} strokeWidth={1.8} />
        </Button>
      )}
    </div>
  );
}
