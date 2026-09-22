import type { ThemeTokens } from "@chronicle/config";
import { THEME_PALETTES } from "@chronicle/utils";
import {
  PaintBoardIcon,
  PaintBucketIcon,
  RefreshIcon,
  RulerIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { Button } from "~/components/ui/button";
import { ColorField } from "~/components/ui/color-field";
import { FontField } from "~/components/ui/font-field";
import { ThemeStudioMisc } from "~/components/world/ThemeStudioMisc";
import { MeasureRow } from "~/routes/settings/appearance/MeasureRow";
import { PANEL, SPLIT } from "~/routes/settings/appearance/styles";
import {
  COLOR_LABELS,
  COLOR_SECTIONS,
  FONT_ORDER,
  FONT_TOKENS,
  NUMERIC_ORDER,
  NUMERIC_TOKENS,
} from "~/routes/settings/appearance/tokens";
import { useEffectiveScheme, useThemeStore } from "~/theme/store";
import type { ThemeTarget } from "~/theme/useThemeTarget";

export interface ThemeStudioSectionsProps {
  target: ThemeTarget;
  openSection: string | null;
  onOpenSection: (section: string | null) => void;
}

export function ThemeStudioSections({
  target,
  openSection,
  onOpenSection,
}: ThemeStudioSectionsProps) {
  const { tokens, overrides, setToken, clearToken } = target;
  const scheme = useEffectiveScheme();
  const saved = useThemeStore((state) => state.palettes);
  const presets = saved.length > 0 ? saved : THEME_PALETTES;

  return (
    <>
      <SettingsGroup
        index={0}
        open={openSection === "presets"}
        onOpenChange={(next) => onOpenSection(next ? "presets" : null)}
        meta={{
          title: "Palettes",
          blurb: "Start from a designed palette, then change anything below.",
          icon: PaintBucketIcon,
        }}
      >
        <div className="grid grid-cols-2 gap-2 p-1 sm:grid-cols-3 lg:grid-cols-4">
          {presets.map((palette) => (
            <button
              key={palette.id}
              type="button"
              onClick={() => setToken(palette.overrides[scheme])}
              className="pressable flex items-center gap-2 rounded-control border-(length:--border-width-card) border-card-border bg-raised px-2.5 py-2 text-left transition-colors hover:border-primary/60"
            >
              <span
                aria-hidden="true"
                className="size-4 shrink-0 rounded-full border border-hairline"
                style={{ background: String(palette.overrides[scheme].primary ?? "") }}
              />
              <span className="truncate text-[0.75rem] text-text-primary">{palette.name}</span>
            </button>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup
        index={1}
        open={openSection === "colours"}
        onOpenChange={(next) => onOpenSection(next ? "colours" : null)}
        meta={{
          title: "Colours",
          blurb: "Every colour this world is drawn with, for the scheme you are in.",
          icon: PaintBoardIcon,
        }}
      >
        {COLOR_SECTIONS.map((section) => (
          <div key={section.title} className={PANEL}>
            <div>
              <p className="text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">
                {section.title}
              </p>
              <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
                {section.hint}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {section.keys.map((key) => (
                <ColorField
                  key={key}
                  label={COLOR_LABELS[key]}
                  value={String(tokens[key])}
                  overridden={overrides[key] !== undefined}
                  onChange={(next) => setToken({ [key]: next })}
                  onRevert={() => clearToken(key)}
                />
              ))}
            </div>
          </div>
        ))}
      </SettingsGroup>

      <SettingsGroup
        index={2}
        open={openSection === "shape"}
        onOpenChange={(next) => onOpenSection(next ? "shape" : null)}
        meta={{
          title: "Shape and depth",
          blurb: "Corners, borders, glass and shadow.",
          icon: RulerIcon,
        }}
      >
        {NUMERIC_ORDER.map((key) => (
          <MeasureRow
            key={key}
            meta={NUMERIC_TOKENS[key]}
            value={Number(tokens[key])}
            overridden={overrides[key] !== undefined}
            onChange={(next) => setToken({ [key]: next } as Partial<ThemeTokens>)}
            onRevert={() => clearToken(key)}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup
        index={3}
        open={openSection === "type"}
        onOpenChange={(next) => onOpenSection(next ? "type" : null)}
        meta={{
          title: "Typeface",
          blurb: "The families this world reads in.",
          icon: TextFontIcon,
        }}
      >
        {FONT_ORDER.map((key) => (
          <div key={key} className={`${PANEL} ${SPLIT}`}>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">
                {FONT_TOKENS[key].label}
                {overrides[key] === undefined ? null : (
                  <>
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                    <span className="sr-only">Changed from the default</span>
                  </>
                )}
              </p>
              <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
                {FONT_TOKENS[key].hint}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FontField
                value={String(tokens[key])}
                onChange={(next) => setToken({ [key]: next })}
                ariaLabel={FONT_TOKENS[key].label}
              />
              {overrides[key] === undefined ? null : (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Revert ${FONT_TOKENS[key].label}`}
                  onClick={() => clearToken(key)}
                >
                  <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={1.5} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </SettingsGroup>

      <ThemeStudioMisc
        index={4}
        open={openSection === "device"}
        onOpenChange={(next) => onOpenSection(next ? "device" : null)}
      />
    </>
  );
}
