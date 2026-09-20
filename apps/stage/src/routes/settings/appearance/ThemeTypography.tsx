import { RefreshIcon, TextFontIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { Button } from "~/components/ui/button";
import { FontField } from "~/components/ui/font-field";
import { useCustomOverrides, useResolvedTheme, useThemeStore } from "~/theme/store";
import { PANEL, SPLIT } from "./styles";
import { FONT_ORDER, FONT_TOKENS } from "./tokens";

export function ThemeTypography({ index, defaultOpen }: { index: number; defaultOpen?: boolean }) {
  const tokens = useResolvedTheme();
  const setGlobalOverride = useThemeStore((state) => state.setGlobalOverride);
  const clearGlobalOverride = useThemeStore((state) => state.clearGlobalOverride);
  const overrides = useCustomOverrides();

  return (
    <SettingsGroup
      index={index}
      defaultOpen={defaultOpen}
      meta={{
        title: "Fonts",
        blurb: "Any family from Google Fonts.",
        icon: TextFontIcon,
      }}
    >
      {FONT_ORDER.map((key) => (
        <div key={key} className={`${PANEL} ${SPLIT}`}>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">
              {FONT_TOKENS[key].label}
              {overrides[key] !== undefined ? (
                <>
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                  <span className="sr-only">Changed from the default</span>
                </>
              ) : null}
            </p>
            <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
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
