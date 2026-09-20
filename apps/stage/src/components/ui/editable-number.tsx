import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export interface EditableNumberProps {
  value: string;
  step: number;
  unit?: string;
  outside?: boolean;
  outsideHint?: string;
  ariaLabel: string;
  describedBy?: string;
  onCommit: (raw: string) => void;
}

export function EditableNumber({
  value,
  step,
  unit,
  outside = false,
  outsideHint,
  ariaLabel,
  describedBy,
  onCommit,
}: EditableNumberProps) {
  const [draft, setDraft] = useState<string | null>(null);

  function finish(commit: boolean): void {
    if (commit && draft !== null && draft.trim() !== "" && Number.isFinite(Number(draft))) {
      onCommit(draft);
    }
    setDraft(null);
  }

  return (
    <span className="flex w-31 shrink-0 items-center justify-end gap-1.5">
      {outside ? (
        <span
          title={outsideHint}
          className="flex size-5 shrink-0 items-center justify-center rounded-(--radius-control) bg-warning/15 text-warning"
        >
          <HugeiconsIcon icon={Alert02Icon} size={12} strokeWidth={2} />
          <span className="sr-only">{outsideHint}</span>
        </span>
      ) : null}

      {draft === null ? (
        <button
          type="button"
          aria-label={`${ariaLabel}, ${value}. Click to type a value`}
          onClick={() => setDraft(value)}
          className={cn(
            "w-18 cursor-text rounded-(--radius-control) border-(length:--border-width-card) border-transparent px-2 py-1.5 text-right text-[0.9375rem] font-semibold tabular-nums outline-none hover:border-hairline focus-visible:border-primary/60",
            outside ? "text-warning" : "text-text-primary",
          )}
        >
          {value}
        </button>
      ) : (
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          value={draft}
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") finish(true);
            if (event.key === "Escape") finish(false);
          }}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          className={cn(
            "w-18 px-2 py-1.5 text-right text-[0.9375rem] font-semibold tabular-nums",
            outside && "border-warning/60 text-warning",
          )}
        />
      )}

      {unit === undefined ? null : <span className="text-[0.6875rem] text-text-muted">{unit}</span>}
    </span>
  );
}
