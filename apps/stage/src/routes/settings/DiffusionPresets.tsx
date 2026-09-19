import { DIFFUSION_PRESETS, type DiffusionPreset, type RuntimeSettings } from "@chronicle/shared";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "~/components/ui/button";

export interface DiffusionPresetsProps {
  image: RuntimeSettings["image"];
  onApply: (values: DiffusionPreset["values"]) => void;
}

function matches(image: RuntimeSettings["image"], preset: DiffusionPreset): boolean {
  return (
    image.steps === preset.values.steps &&
    image.cfg === preset.values.cfg &&
    image.sampler === preset.values.sampler &&
    image.scheduler === preset.values.scheduler
  );
}

const FAST_CHECKPOINT = /lightning|turbo|lcm|hyper/iu;

export function DiffusionPresets({ image, onApply }: DiffusionPresetsProps) {
  const active = DIFFUSION_PRESETS.find((preset) => matches(image, preset));
  const mismatched = FAST_CHECKPOINT.test(image.checkpoint) && image.steps > 12;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.05] bg-white/[0.015] px-4 py-3.5">
      <div>
        <p className="text-[14px] font-medium tracking-[-0.01em] text-text-primary">
          Step and guidance preset
        </p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
          These four values have to match the kind of checkpoint you loaded. Lightning settings on a
          full model produce mush; full-model settings on Lightning produce burnt output.
        </p>
      </div>

      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        {DIFFUSION_PRESETS.map((preset) => {
          const selected = active?.id === preset.id;
          return (
            <Button
              variant="outline"
              key={preset.id}
              aria-pressed={selected}
              onClick={() => onApply(preset.values)}
              className={`h-auto flex-col items-start gap-1 rounded-xl px-3.5 py-3 text-left font-normal whitespace-normal ${
                selected ? "border-primary/40 bg-primary/[0.07] hover:border-primary/40" : ""
              }`}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-text-primary">
                {preset.label}
                {selected ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={14}
                    strokeWidth={2}
                    className="text-text-accent"
                  />
                ) : null}
              </span>
              <span className="text-[11px] leading-relaxed text-text-muted">{preset.summary}</span>
              <span className="mt-0.5 text-[10px] tabular-nums text-text-muted/60">
                {preset.values.steps} steps · cfg {preset.values.cfg} · {preset.values.sampler}
              </span>
            </Button>
          );
        })}
      </div>

      {mismatched ? (
        <p
          role="alert"
          className="mt-1 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] leading-relaxed text-warning"
        >
          The checkpoint below names itself a fast model, but {image.steps} steps are set. That
          combination burns the output. Pick the Lightning preset, or load a full SDXL checkpoint.
        </p>
      ) : active === undefined ? (
        <p className="mt-0.5 text-[11px] text-text-muted">
          Custom values. Make sure they suit the checkpoint below.
        </p>
      ) : null}
    </div>
  );
}
