import { PaintBoardIcon, RefreshIcon, RulerIcon, TextFontIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { Button } from "~/components/ui/button";
import { ColorField } from "~/components/ui/color-field";
import { FontField } from "~/components/ui/font-field";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { useResolvedTheme, useSchemeOverrides, useThemeStore } from "~/theme/store";
import { MeasureRow } from "./MeasureRow";
import {
  COLOR_LABELS,
  COLOR_SECTIONS,
  FONT_ORDER,
  FONT_TOKENS,
  NUMERIC_ORDER,
  NUMERIC_TOKENS,
} from "./tokens";

const PREFERENCES = [{ values: ["system", "dark", "light"] }];

const PANEL = "flex flex-col gap-2.5 rounded-2xl border border-hairline bg-raised px-4 py-3.5";
const SPLIT = "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,340px)] sm:items-center sm:gap-8";

export function ThemeColors({ index }: { index: number }) {
  const tokens = useResolvedTheme();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const setGlobalOverride = useThemeStore((state) => state.setGlobalOverride);
  const clearGlobalOverride = useThemeStore((state) => state.clearGlobalOverride);
  const overrides = useSchemeOverrides();

  return (
    <SettingsGroup
      index={index}
      meta={{
        title: "Theme colours",
        blurb:
          "Every colour the interface draws with, applied the moment you change it. Each scheme keeps its own set.",
        icon: PaintBoardIcon,
      }}
    >
      <div className={`${PANEL} ${SPLIT}`}>
        <div className="min-w-0">
          <Label htmlFor="theme-preference">Colour scheme</Label>
          <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
            Follow the system, or pin the interface to one. Dark and light remember their own
            colours, so editing one never disturbs the other.
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
        <div key={section.title} className={PANEL}>
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
                onRevert={() => clearGlobalOverride(key)}
              />
            ))}
          </div>
        </div>
      ))}
    </SettingsGroup>
  );
}

export function ThemeTypography({ index }: { index: number }) {
  const tokens = useResolvedTheme();
  const setGlobalOverride = useThemeStore((state) => state.setGlobalOverride);
  const clearGlobalOverride = useThemeStore((state) => state.clearGlobalOverride);
  const overrides = useSchemeOverrides();

  return (
    <SettingsGroup
      index={index}
      meta={{
        title: "Fonts",
        blurb: "Any family from Google Fonts, searched live and loaded the moment you pick it.",
        icon: TextFontIcon,
      }}
    >
      {FONT_ORDER.map((key) => (
        <div key={key} className={`${PANEL} ${SPLIT}`}>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[14px] font-medium tracking-[-0.01em] text-text-primary">
              {FONT_TOKENS[key].label}
              {overrides[key] !== undefined ? (
                <>
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                  <span className="sr-only">Changed from the default</span>
                </>
              ) : null}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
              {FONT_TOKENS[key].hint}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FontField
              value={String(tokens[key])}
              onChange={(next) => setGlobalOverride({ [key]: next })}
              ariaLabel={FONT_TOKENS[key].label}
            />
            {overrides[key] !== undefined ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Revert ${FONT_TOKENS[key].label}`}
                onClick={() => clearGlobalOverride(key)}
              >
                <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={1.5} />
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </SettingsGroup>
  );
}

export function ThemeShape({ index }: { index: number }) {
  const tokens = useResolvedTheme();
  const setGlobalOverride = useThemeStore((state) => state.setGlobalOverride);
  const clearGlobalOverride = useThemeStore((state) => state.clearGlobalOverride);
  const resetTheme = useThemeStore((state) => state.resetTheme);
  const overrides = useSchemeOverrides();

  const changed = useMemo(() => Object.keys(overrides).length, [overrides]);

  return (
    <SettingsGroup
      index={index}
      meta={{
        title: "Shape and spacing",
        blurb: `Corner radius, borders, text size and the blur behind glass${changed > 0 ? ` · ${changed} change${changed === 1 ? "" : "s"} in this scheme` : ""}.`,
        icon: RulerIcon,
      }}
    >
      {NUMERIC_ORDER.map((key) => (
        <MeasureRow
          key={key}
          meta={NUMERIC_TOKENS[key]}
          value={Number(tokens[key])}
          overridden={overrides[key] !== undefined}
          onChange={(next) => setGlobalOverride({ [key]: next })}
          onRevert={() => clearGlobalOverride(key)}
        />
      ))}

      <div className={`${PANEL} flex-row items-center justify-between gap-4`}>
        <div className="min-w-0">
          <p className="text-[14px] font-medium tracking-[-0.01em] text-text-primary">
            Restore the designed theme
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
            Drops every appearance change in both schemes on this device. Runtime settings are
            untouched.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetTheme();
            toast.success("Appearance reset", { description: "Back to the designed theme." });
          }}
          className="gap-1.5"
        >
          <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={1.5} />
          Reset all
        </Button>
      </div>
    </SettingsGroup>
  );
}
