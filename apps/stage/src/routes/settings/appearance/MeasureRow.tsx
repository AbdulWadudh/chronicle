import { RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId } from "react";
import { Button } from "~/components/ui/button";
import { EditableNumber } from "~/components/ui/editable-number";
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
  const decimals = decimalsOf(meta.bound.step);
  const outside = value < meta.bound.min || value > meta.bound.max;

  return (
    <div className="flex flex-col gap-2.5 rounded-card border-(length:--border-width-card) border-hairline bg-raised px-4 py-3.5 transition-colors duration-200 hover:border-hairline-strong hover:bg-raised-hover sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,340px)] sm:items-center sm:gap-8 motion-reduce:transition-none">
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
        <p id={hintId} className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
          {meta.hint}
        </p>
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-4">
          <Slider
            id={id}
            value={value}
            min={Math.min(meta.bound.min, value)}
            max={Math.max(meta.bound.max, value)}
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
          <EditableNumber
            value={value.toFixed(decimals)}
            step={meta.bound.step}
            unit={meta.unit}
            outside={outside}
            outsideHint={`Outside the designed range of ${meta.bound.min} to ${meta.bound.max}`}
            ariaLabel={meta.label}
            describedBy={hintId}
            onCommit={(raw) => onChange(Number(raw))}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="flex flex-wrap gap-1">
            {meta.presets.map((preset) => (
              <Button
                key={preset.label}
                variant={value === preset.value ? "default" : "outline"}
                onClick={() => onChange(preset.value)}
                className="h-6 rounded-control px-2 text-[0.625rem] font-medium"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <span
            className={`text-[0.625rem] tabular-nums ${outside ? "font-medium text-warning" : "text-text-muted/50"}`}
          >
            {meta.bound.min}–{meta.bound.max}
          </span>
        </div>
      </div>
    </div>
  );
}
