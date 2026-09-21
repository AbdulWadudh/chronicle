import { RENDER_STYLES } from "@chronicle/config";
import type { ComposeMode, RenderStyle, ShotSize } from "@chronicle/utils";
import { ComposableField } from "~/components/common/ComposableField";
import { Select } from "~/components/ui/select";
import { LabeledRow, RowGroup } from "~/components/world/LabeledRow";

const SHOT_LABEL: Record<ShotSize, string> = {
  closeUp: "Close-up",
  waistUp: "Waist up",
  threeQuarter: "Head to knees",
  fullBody: "Full body",
};

const SHOT_VALUES = Object.values(SHOT_LABEL);

const STYLE_VALUES = Object.values(RENDER_STYLES).map((entry) => entry.label);

const STYLE_BY_LABEL = Object.fromEntries(
  Object.entries(RENDER_STYLES).map(([name, entry]) => [entry.label, name as RenderStyle]),
) as Record<string, RenderStyle>;

const SHOT_BY_LABEL = Object.fromEntries(
  Object.entries(SHOT_LABEL).map(([shot, label]) => [label, shot as ShotSize]),
) as Record<string, ShotSize>;

export interface WorldLookFieldsProps {
  visualStyle: string;
  shotSize: ShotSize;
  artStyle: RenderStyle;
  busyMode: ComposeMode | null;
  onVisualStyleChange: (value: string) => void;
  onShotSizeChange: (value: ShotSize) => void;
  onArtStyleChange: (value: RenderStyle) => void;
  onCompose: (mode: ComposeMode) => void;
}

export function WorldLookFields({
  visualStyle,
  shotSize,
  artStyle,
  busyMode,
  onVisualStyleChange,
  onShotSizeChange,
  onArtStyleChange,
  onCompose,
}: WorldLookFieldsProps) {
  return (
    <>
      <ComposableField
        id="world-visual-style"
        label="Art direction"
        actionNoun="art direction"
        value={visualStyle}
        rows={3}
        placeholder="late industrial, soot-black brick, sodium glare, standing water, perpetual drizzle"
        hint="Era, architecture, materials, palette, light and weather. Every cover, portrait and scene is drawn from it, so they look like one place. Clear it and a new one is written on the next render."
        busyMode={busyMode}
        onChange={onVisualStyleChange}
        onCompose={onCompose}
      />

      <RowGroup label="Rendering">
        <LabeledRow
          label="Art style"
          blurb="Drives the prompt and the model every image here is rendered with."
        >
          <Select
            value={RENDER_STYLES[artStyle].label}
            groups={[{ values: STYLE_VALUES }]}
            onValueChange={(label) => {
              const next = STYLE_BY_LABEL[label];
              if (next !== undefined) onArtStyleChange(next);
            }}
            ariaLabel="Art style"
          />
        </LabeledRow>

        <LabeledRow label="Shot size" blurb="Tighter shots give faces more pixels.">
          <Select
            value={SHOT_LABEL[shotSize]}
            groups={[{ values: SHOT_VALUES }]}
            onValueChange={(label) => {
              const next = SHOT_BY_LABEL[label];
              if (next !== undefined) onShotSizeChange(next);
            }}
            ariaLabel="Shot size"
          />
        </LabeledRow>
      </RowGroup>
    </>
  );
}
