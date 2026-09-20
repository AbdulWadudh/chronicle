import { KOKORO_VOICES, SAMPLERS, SCHEDULERS, type SettingBound } from "@chronicle/config";
import { useId } from "react";
import { EditableNumber } from "~/components/ui/editable-number";
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
  "flex flex-col gap-2.5 rounded-card border-(length:--border-width-card) border-hairline bg-raised px-4 py-3.5 transition-colors duration-200 hover:border-hairline-strong hover:bg-raised-hover motion-reduce:transition-none";

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
  const outside =
    typeof value === "number" && bound !== undefined
      ? value < bound.min || value > bound.max
      : false;

  const groups = OPTIONS[field];
  const stacked = meta.multiline === true;

  const description = (
    <div className="min-w-0">
      <Label htmlFor={id}>{meta.label}</Label>
      <p id={hintId} className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
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
              min={Math.min(bound.min, value)}
              max={Math.max(bound.max, value)}
              step={bound.step}
              onValueChange={(next) => {
                if (typeof next === "number") onChange(next);
              }}
              aria-label={meta.label}
              aria-describedby={hintId}
            />
            <EditableNumber
              value={formatted(value, bound.step)}
              step={bound.step}
              unit={meta.unit}
              outside={outside}
              outsideHint={`Outside the designed range of ${bound.min} to ${bound.max}`}
              ariaLabel={meta.label}
              describedBy={hintId}
              onCommit={(raw) => onChange(Number(raw))}
            />
          </div>
          <span
            className={`text-right text-[0.625rem] tabular-nums ${outside ? "font-medium text-warning" : "text-text-muted/50"}`}
          >
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
            className={meta.mono === true ? "font-mono text-[0.75rem]" : undefined}
          />
        )}
      </div>
    </div>
  );
}
