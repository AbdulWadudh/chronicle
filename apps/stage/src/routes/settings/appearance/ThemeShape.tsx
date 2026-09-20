import {
  MinusSignIcon,
  MoreVerticalIcon,
  Move01Icon,
  PauseIcon,
  RulerIcon,
  ViewOffIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { useMemo } from "react";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { Segmented, type SegmentedOption } from "~/components/ui/segmented";
import type { MotionLevel, ScrollbarStyle } from "~/theme/store";
import { useCustomOverrides, useResolvedTheme, useThemeStore } from "~/theme/store";
import { MeasureRow } from "./MeasureRow";
import { PANEL, SPLIT } from "./styles";
import { NUMERIC_ORDER, NUMERIC_TOKENS } from "./tokens";

const SCROLLBARS: readonly SegmentedOption<ScrollbarStyle>[] = [
  { value: "full", label: "Full", icon: MoreVerticalIcon },
  { value: "thin", label: "Thin", icon: MinusSignIcon },
  { value: "hidden", label: "Hidden", icon: ViewOffIcon },
];

const MOTIONS: readonly SegmentedOption<MotionLevel>[] = [
  { value: "off", label: "Off", icon: PauseIcon },
  { value: "subtle", label: "Subtle", icon: Move01Icon },
  { value: "full", label: "Full", icon: ZapIcon },
];

export function ThemeShape({ index, defaultOpen }: { index: number; defaultOpen?: boolean }) {
  const tokens = useResolvedTheme();
  const setGlobalOverride = useThemeStore((state) => state.setGlobalOverride);
  const clearGlobalOverride = useThemeStore((state) => state.clearGlobalOverride);
  const motionLevel = useThemeStore((state) => state.motionLevel);
  const setMotionLevel = useThemeStore((state) => state.setMotionLevel);
  const scrollbar = useThemeStore((state) => state.scrollbar);
  const setScrollbar = useThemeStore((state) => state.setScrollbar);
  const overrides = useCustomOverrides();

  const changed = useMemo(() => Object.keys(overrides).length, [overrides]);

  return (
    <SettingsGroup
      index={index}
      defaultOpen={defaultOpen}
      meta={{
        title: "Shape and motion",
        blurb: `Corners, borders, text size, shadow and motion${changed > 0 ? ` · ${changed} changed` : ""}.`,
        icon: RulerIcon,
      }}
    >
      <div className={`${PANEL} ${SPLIT}`}>
        <div className="min-w-0">
          <p className="text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">
            Component motion
          </p>
          <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
            Off keeps every colour and shadow, and removes only the movement.
          </p>
        </div>
        <Segmented
          value={motionLevel}
          options={MOTIONS}
          onValueChange={setMotionLevel}
          ariaLabel="Component motion"
        />
      </div>

      <div className={`${PANEL} ${SPLIT}`}>
        <div className="min-w-0">
          <p className="text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">
            Scrollbar
          </p>
          <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
            Hidden keeps scrolling, it only removes the bar.
          </p>
        </div>
        <Segmented
          value={scrollbar}
          options={SCROLLBARS}
          onValueChange={setScrollbar}
          ariaLabel="Scrollbar"
        />
      </div>

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
    </SettingsGroup>
  );
}
