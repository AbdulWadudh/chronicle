import type { PaletteOverrides } from "@chronicle/utils";
import { PaintBoardIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { LabeledRow, RowGroup } from "~/components/common/FormRow";
import { Button } from "~/components/ui/button";
import { Select } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { useThemeStore } from "~/theme/store";

const NONE = "No world theme";

export interface WorldThemeFieldsProps {
  themeOverrides: PaletteOverrides | null;
  onThemeChange: (next: PaletteOverrides | null) => void;
  onOpenStudio?: (() => void) | undefined;
}

function nameOf(
  palettes: readonly { id: string; name: string; overrides: PaletteOverrides }[],
  theme: PaletteOverrides | null,
): string {
  if (theme === null) return NONE;
  const signature = JSON.stringify(theme);
  return palettes.find((one) => JSON.stringify(one.overrides) === signature)?.name ?? "Custom";
}

export function WorldThemeFields({
  themeOverrides,
  onThemeChange,
  onOpenStudio,
}: WorldThemeFieldsProps) {
  const palettes = useThemeStore((state) => state.palettes);
  const enabled = useThemeStore((state) => state.worldThemeEnabled);
  const toggle = useThemeStore((state) => state.toggleWorldTheme);

  const names = [NONE, ...palettes.map((one) => one.name)];
  const current = nameOf(palettes, themeOverrides);

  return (
    <RowGroup label="Theme">
      <LabeledRow
        label="World palette"
        blurb="The colours this world is played in. Everyone who opens it starts here."
      >
        <Select
          value={names.includes(current) ? current : NONE}
          groups={[{ values: names }]}
          onValueChange={(name) => {
            if (name === NONE) {
              onThemeChange(null);
              return;
            }
            const picked = palettes.find((one) => one.name === name);
            if (picked !== undefined) onThemeChange(picked.overrides);
          }}
          ariaLabel="World palette"
        />
      </LabeledRow>

      {onOpenStudio === undefined ? null : (
        <LabeledRow
          label="Theme studio"
          blurb="Every colour, corner, shadow and typeface, for this world or just for you."
        >
          <Button variant="outline" size="sm" onClick={onOpenStudio} className="gap-1.5">
            <HugeiconsIcon icon={PaintBoardIcon} size={14} strokeWidth={1.5} />
            Open
          </Button>
        </LabeledRow>
      )}

      <LabeledRow
        label="Use the world's palette"
        blurb={
          enabled
            ? "Worlds you open recolour the app."
            : "Your own theme stays, whichever world you open."
        }
      >
        <Switch
          checked={enabled}
          onCheckedChange={toggle}
          aria-label="Use the world's palette when playing"
        />
      </LabeledRow>
    </RowGroup>
  );
}
