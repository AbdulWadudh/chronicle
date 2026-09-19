import { KOKORO_VOICES, SAMPLERS, SCHEDULERS, type SettingBound } from "@chronicle/shared";
import { useId } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, type SelectOptionGroup } from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import type { FieldMeta } from "./fields";

const OPTIONS: Record<string, readonly SelectOptionGroup[]> = {
  sampler: [{ values: SAMPLERS }],
  scheduler: [{ values: SCHEDULERS }],
  voice: KOKORO_VOICES.map((group) => ({ label: group.label, values: group.voices })),
};

const ROW =
  "flex flex-col gap-2.5 rounded-2xl border border-white/[0.05] bg-white/[0.015] px-4 py-3.5 transition-colors duration-200 hover:border-white/[0.09] hover:bg-white/[0.028] motion-reduce:transition-none";

const SPLIT = "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,340px)] sm:items-center sm:gap-8";

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
  const groups = OPTIONS[field];
  const stacked = meta.multiline === true;

  const description = (
    <div className="min-w-0">
      <Label htmlFor={id}>{meta.label}</Label>
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
              value={value}
              min={bound.min}
              max={bound.max}
              step={bound.step}
              onValueChange={(next) => {
                if (typeof next === "number") onChange(next);
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
          <Textarea
            id={id}
            value={String(value)}
            aria-describedby={hintId}
            rows={2}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : groups !== undefined ? (
          <Select
            id={id}
            value={String(value)}
            groups={groups}
            onValueChange={onChange}
            ariaLabel={meta.label}
            describedBy={hintId}
            mono={meta.mono === true}
          />
        ) : (
          <Input
            id={id}
            value={String(value)}
            aria-describedby={hintId}
            onChange={(event) => onChange(event.target.value)}
            className={meta.mono === true ? "font-mono text-[12px]" : undefined}
          />
        )}
      </div>
    </div>
  );
}
