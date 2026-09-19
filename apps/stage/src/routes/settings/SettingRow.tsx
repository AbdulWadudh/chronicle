import { SAMPLERS, SCHEDULERS, type SettingBound } from "@chronicle/shared";
import { useId } from "react";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import type { FieldMeta } from "./fields";

const OPTIONS: Record<string, readonly string[]> = {
  sampler: SAMPLERS,
  scheduler: SCHEDULERS,
};

const ROW =
  "flex flex-col gap-2.5 rounded-2xl border border-white/[0.05] bg-white/[0.015] px-4 py-3.5 transition-colors duration-200 hover:border-white/[0.09] hover:bg-white/[0.028] motion-reduce:transition-none";

const SPLIT = "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,340px)] sm:items-center sm:gap-8";

const TEXT_INPUT =
  "w-full rounded-xl border border-card-border bg-input-surface px-3.5 py-2.5 text-[13px] text-text-primary outline-none transition-colors focus:border-primary/60 motion-reduce:transition-none";

export interface SettingRowProps {
  field: string;
  meta: FieldMeta;
  value: number | boolean | string;
  bound?: SettingBound;
  onChange: (value: number | boolean | string) => void;
}

function formatted(value: number, step: number): string {
  const decimals = (String(step).split(".")[1] ?? "").length;
  return value.toFixed(decimals);
}

export function SettingRow({ field, meta, value, bound, onChange }: SettingRowProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const options = OPTIONS[field];
  const stacked = meta.multiline === true;

  const description = (
    <div className="min-w-0">
      <label htmlFor={id} className="text-[14px] font-medium tracking-[-0.01em] text-text-primary">
        {meta.label}
      </label>
      <p id={hintId} className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
        {meta.hint}
      </p>
    </div>
  );

  if (typeof value === "boolean") {
    return (
      <div className={`${ROW} ${SPLIT}`}>
        {description}
        <div className="flex sm:justify-end">
          <Switch
            id={id}
            checked={value}
            onCheckedChange={onChange}
            aria-describedby={hintId}
            aria-label={meta.label}
          />
        </div>
      </div>
    );
  }

  if (typeof value === "number" && bound !== undefined) {
    return (
      <div className={`${ROW} ${SPLIT}`}>
        {description}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-4">
            <Slider
              value={[value]}
              min={bound.min}
              max={bound.max}
              step={bound.step}
              onValueChange={([next]) => {
                if (next !== undefined) onChange(next);
              }}
              aria-label={meta.label}
              aria-describedby={hintId}
            />
            <div className="flex w-[84px] shrink-0 items-baseline justify-end gap-1">
              <span className="text-[15px] font-semibold tabular-nums text-text-primary">
                {formatted(value, bound.step)}
              </span>
              {meta.unit === undefined ? null : (
                <span className="text-[11px] text-text-muted">{meta.unit}</span>
              )}
            </div>
          </div>
          <span className="text-right text-[10px] tabular-nums text-text-muted/50">
            {bound.min}–{bound.max}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${ROW} ${stacked ? "" : SPLIT}`}>
      {description}
      <div>
        {stacked ? (
          <textarea
            id={id}
            value={String(value)}
            aria-describedby={hintId}
            rows={2}
            onChange={(event) => onChange(event.target.value)}
            className={`${TEXT_INPUT} resize-none`}
          />
        ) : (
          <>
            <input
              id={id}
              value={String(value)}
              aria-describedby={hintId}
              list={options === undefined ? undefined : `${id}-options`}
              onChange={(event) => onChange(event.target.value)}
              className={`${TEXT_INPUT} ${meta.mono === true ? "font-mono text-[12px]" : ""}`}
            />
            {options === undefined ? null : (
              <datalist id={`${id}-options`}>
                {options.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            )}
          </>
        )}
      </div>
    </div>
  );
}
