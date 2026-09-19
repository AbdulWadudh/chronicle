import { PaintBoardIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { ColorField } from "~/components/ui/color-field";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { useResolvedTheme, useThemeStore } from "~/theme/store";
import { SettingsGroup } from "../SettingsGroup";
import { COLOR_LABELS, COLOR_SECTIONS, NUMERIC_ORDER, NUMERIC_TOKENS } from "./tokens";

const PREFERENCES = [{ values: ["system", "dark", "light"] }];

function decimalsOf(step: number): number {
  return (String(step).split(".")[1] ?? "").length;
}

export function Appearance({ index }: { index: number }) {
  const tokens = useResolvedTheme();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const overrides = useThemeStore((state) => state.globalOverrides);
  const setGlobalOverride = useThemeStore((state) => state.setGlobalOverride);
  const resetTheme = useThemeStore((state) => state.resetTheme);

  const changed = useMemo(() => Object.keys(overrides).length, [overrides]);

  return (
    <SettingsGroup
      index={index}
      meta={{
        title: "Appearance",
        blurb: `Every colour and measurement in the interface, applied as you change it. Stored on this device${changed > 0 ? ` · ${changed} changed` : ""}.`,
        icon: PaintBoardIcon,
      }}
    >
      <div className="flex flex-col gap-2.5 rounded-2xl border border-hairline bg-raised px-4 py-3.5 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,340px)] sm:items-center sm:gap-8">
        <div className="min-w-0">
          <Label htmlFor="theme-preference">Colour scheme</Label>
          <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
            Follow the system, or pin the interface to one scheme. Your edits below apply to the
            scheme that is showing.
          </p>
        </div>
        <Select
          id="theme-preference"
          value={preference}
          groups={PREFERENCES}
          onValueChange={(next) => {
            if (next === "system" || next === "dark" || next === "light") setPreference(next);
          }}
          ariaLabel="Colour scheme"
        />
      </div>

      {COLOR_SECTIONS.map((section) => (
        <div
          key={section.title}
          className="flex flex-col gap-2.5 rounded-2xl border border-hairline bg-raised px-4 py-3.5"
        >
          <div>
            <p className="text-[14px] font-medium tracking-[-0.01em] text-text-primary">
              {section.title}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">{section.hint}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {section.keys.map((key) => (
              <ColorField
                key={key}
                label={COLOR_LABELS[key]}
                value={String(tokens[key])}
                overridden={overrides[key] !== undefined}
                onChange={(next) => setGlobalOverride({ [key]: next })}
              />
            ))}
          </div>
        </div>
      ))}

      {NUMERIC_ORDER.map((key) => {
        const meta = NUMERIC_TOKENS[key];
        const value = Number(tokens[key]);
        return (
          <div
            key={key}
            className="flex flex-col gap-2.5 rounded-2xl border border-hairline bg-raised px-4 py-3.5 transition-colors duration-200 hover:border-hairline-strong hover:bg-raised-hover sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,340px)] sm:items-center sm:gap-8 motion-reduce:transition-none"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[14px] font-medium tracking-[-0.01em] text-text-primary">
                {meta.label}
                {overrides[key] !== undefined ? (
                  <>
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                    <span className="sr-only">Changed from the default</span>
                  </>
                ) : null}
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">{meta.hint}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-4">
                <Slider
                  value={value}
                  min={meta.bound.min}
                  max={meta.bound.max}
                  step={meta.bound.step}
                  onValueChange={(next) => {
                    if (typeof next === "number") setGlobalOverride({ [key]: next });
                  }}
                  aria-label={meta.label}
                />
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
      })}

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-raised px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[14px] font-medium tracking-[-0.01em] text-text-primary">
            Restore the designed theme
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
            Drops every appearance change on this device. Runtime settings above are untouched.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={changed === 0}
          onClick={() => {
            resetTheme();
            toast.success("Appearance reset", { description: "Back to the designed theme." });
          }}
          className="gap-1.5"
        >
          <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={1.5} />
          Reset
        </Button>
      </div>
    </SettingsGroup>
  );
}
