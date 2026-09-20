import { ArrowRight01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { useThemeStore } from "~/theme/store";
import type { ThemeEdit } from "./pendingEdits";
import { isColorToken, labelOf } from "./tokens";

function Value({ value, colour }: { value: string; colour: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {colour ? (
        <span
          aria-hidden="true"
          className="chronicle-swatch size-3.5 shrink-0 rounded-(--radius-control) border border-hairline-strong"
          style={{ ["--swatch" as string]: value }}
        />
      ) : null}
      <span className="truncate font-mono text-[0.6875rem]">{value}</span>
    </span>
  );
}

export function EditList({ edits }: { edits: readonly ThemeEdit[] }) {
  const clearSchemeOverride = useThemeStore((state) => state.clearSchemeOverride);

  if (edits.length === 0) {
    return (
      <p className="rounded-(--radius-control) border-(length:--border-width-card) border-hairline bg-raised px-3 py-4 text-center text-[0.75rem] text-text-muted">
        Nothing changed since the preset was applied. Saving keeps it exactly as it is.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {edits.map((edit) => (
        <div
          key={`${edit.scheme}-${edit.key}`}
          className="flex items-center gap-3 rounded-(--radius-control) border-(length:--border-width-card) border-hairline bg-raised px-3 py-2"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[0.75rem] font-medium text-text-primary">
              {labelOf(edit.key)}
              <span className="rounded-(--radius-control) bg-sunken px-1.5 py-0.5 text-[0.5625rem] tracking-[0.08em] text-text-muted uppercase">
                {edit.scheme}
              </span>
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-text-muted">
              <Value value={edit.before} colour={isColorToken(edit.key)} />
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={11}
                strokeWidth={2}
                className="shrink-0"
              />
              <span className="text-text-primary">
                <Value value={edit.after} colour={isColorToken(edit.key)} />
              </span>
            </span>
          </span>
          <Tooltip content="Drop this change">
            <Button
              variant="outline"
              size="iconSm"
              aria-label={`Drop the ${labelOf(edit.key)} change in ${edit.scheme}`}
              onClick={() => clearSchemeOverride(edit.scheme, edit.key)}
            >
              <HugeiconsIcon icon={RefreshIcon} size={12} strokeWidth={1.8} />
            </Button>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}
