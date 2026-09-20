import { PaintBoardIcon } from "@hugeicons/core-free-icons";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { ColorField } from "~/components/ui/color-field";
import { useCustomOverrides, useResolvedTheme, useThemeStore } from "~/theme/store";
import { PANEL } from "./styles";
import { COLOR_LABELS, COLOR_SECTIONS } from "./tokens";

export function ThemeColors({ index, defaultOpen }: { index: number; defaultOpen?: boolean }) {
  const tokens = useResolvedTheme();
  const setGlobalOverride = useThemeStore((state) => state.setGlobalOverride);
  const clearGlobalOverride = useThemeStore((state) => state.clearGlobalOverride);
  const overrides = useCustomOverrides();

  return (
    <SettingsGroup
      index={index}
      defaultOpen={defaultOpen}
      meta={{
        title: "Theme colours",
        blurb: "Every colour the interface draws with, per scheme.",
        icon: PaintBoardIcon,
      }}
    >
      {COLOR_SECTIONS.map((section) => (
        <div key={section.title} className={PANEL}>
          <div>
            <p className="text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">
              {section.title}
            </p>
            <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">{section.hint}</p>
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
