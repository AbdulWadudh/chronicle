import {
  MinusSignIcon,
  MoreVerticalIcon,
  Move01Icon,
  PauseIcon,
  PuzzleIcon,
  ViewOffIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { Label } from "~/components/ui/label";
import { Segmented, type SegmentedOption } from "~/components/ui/segmented";
import { Switch } from "~/components/ui/switch";
import { PANEL, SPLIT } from "~/routes/settings/appearance/styles";
import type { MotionLevel, ScrollbarStyle } from "~/theme/store";
import { useThemeStore } from "~/theme/store";

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

function Row({
  id,
  title,
  blurb,
  checked,
  onChange,
}: {
  id: string;
  title: string;
  blurb: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className={`${PANEL} ${SPLIT}`}>
      <div className="min-w-0">
        <Label htmlFor={id}>{title}</Label>
        <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">{blurb}</p>
      </div>
      <div className="flex justify-end">
        <Switch id={id} checked={checked} onCheckedChange={onChange} aria-label={title} />
      </div>
    </div>
  );
}

export function ThemeStudioMisc({
  index,
  open,
  onOpenChange,
}: {
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useThemeStore();

  return (
    <SettingsGroup
      index={index}
      open={open}
      onOpenChange={onOpenChange}
      meta={{
        title: "This device",
        blurb: "Motion, scrollbars and playback. These follow you, not the world.",
        icon: PuzzleIcon,
      }}
    >
      <div className={`${PANEL} ${SPLIT}`}>
        <div className="min-w-0">
          <p className="text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">Motion</p>
          <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
            Off keeps every colour and shadow, it only removes movement.
          </p>
        </div>
        <Segmented
          value={store.motionLevel}
          options={MOTIONS}
          onValueChange={store.setMotionLevel}
          ariaLabel="Motion"
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
          value={store.scrollbar}
          options={SCROLLBARS}
          onValueChange={store.setScrollbar}
          ariaLabel="Scrollbar"
        />
      </div>

      <Row
        id="studio-immersive"
        title="Infinite Worlds experience"
        blurb="Each scene opens full screen, types its opening line, then folds into a card."
        checked={store.immersive}
        onChange={store.toggleImmersive}
      />

      <Row
        id="studio-cinema"
        title="Cinema Mode"
        blurb="Reveals narration one sentence at a time, paced by its audio."
        checked={store.cinemaMode}
        onChange={store.toggleCinemaMode}
      />

      <Row
        id="studio-history"
        title="Actions on past turns"
        blurb="Show the narration and re-voice buttons under every earlier turn."
        checked={store.historyActions}
        onChange={store.toggleHistoryActions}
      />
    </SettingsGroup>
  );
}
