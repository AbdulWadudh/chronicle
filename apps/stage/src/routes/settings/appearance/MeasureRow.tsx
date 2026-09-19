import { RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import type { NumericTokenMeta } from "./tokens";

export interface MeasureRowProps {
  meta: NumericTokenMeta;
  value: number;
  overridden: boolean;
  onChange: (value: number) => void;
  onRevert: () => void;
}

function decimalsOf(step: number): number {
  return (String(step).split(".")[1] ?? "").length;
}

export function MeasureRow({ meta, value, overridden, onChange, onRevert }: MeasureRowProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-hairline bg-raised px-4 py-3.5 transition-colors duration-200 hover:border-hairline-strong hover:bg-raised-hover sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,340px)] sm:items-center sm:gap-8 motion-reduce:transition-none">
      <div className="min-w-0">
        <Label htmlFor={id} className="flex items-center gap-1.5">
          {meta.label}
          {overridden ? (
            <>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              <span className="sr-only">Changed from the default</span>
            </>
          ) : null}
        </Label>
        <p id={hintId} className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
          {meta.hint}
        </p>
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-4">
          <Slider
            id={id}
            value={value}
            min={meta.bound.min}
            max={meta.bound.max}
            step={meta.bound.step}
            onValueChange={(next) => {
              if (typeof next === "number") onChange(next);
            }}
            aria-label={meta.label}
            aria-describedby={hintId}
          />
          {overridden ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Revert ${meta.label} to its default`}
              onClick={onRevert}
              className="size-7 text-primary"
            >
              <HugeiconsIcon icon={RefreshIcon} size={12} strokeWidth={1.8} />
            </Button>
          ) : null}
          <div className="flex w-[84px] shrink-0 items-baseline justify-end gap-1">
            <span className="text-[15px] font-semibold tabular-nums text-text-primary">
              {value.toFixed(decimalsOf(meta.bound.step))}
            </span>
            {meta.unit === undefined ? null : (
              <span className="text-[11px] text-text-muted">{meta.unit}</span>
            )}
          </div>
        </div>
        <span className="text-right text-[10px] tabular-nums text-text-muted/50">
          {meta.bound.min}–{meta.bound.max}
        </span>
      </div>
    </div>
  );
}
