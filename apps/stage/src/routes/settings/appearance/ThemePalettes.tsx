import { mergeThemeTokens, THEME_PALETTES, type ThemePalette } from "@chronicle/utils";
import { PaintBucketIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { baseTokens, useScheme, useThemeStore } from "~/theme/store";
import { CurrentTheme } from "./CurrentTheme";
import { MergePaletteDialog } from "./MergePaletteDialog";
import { PaletteCard } from "./PaletteCard";

const PAGE_SIZE = 8;

function isSaved(id: string): boolean {
  return id !== "" && !THEME_PALETTES.some((builtIn) => builtIn.id === id);
}

const DEFAULT_CARD: ThemePalette = {
  id: "",
  name: "Chronicle",
  blurb: "The designed theme. Gold on ink, soft glass, generous corners.",
  overrides: { dark: {}, light: {} },
};

export function ThemePalettes({ index, defaultOpen }: { index: number; defaultOpen?: boolean }) {
  const scheme = useScheme();
  const palettes = useThemeStore((state) => state.palettes);
  const paletteId = useThemeStore((state) => state.paletteId);
  const applyPalette = useThemeStore((state) => state.applyPalette);
  const [merging, setMerging] = useState<ThemePalette | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const cards = useMemo(
    () =>
      [DEFAULT_CARD, ...palettes].map((palette) => ({
        palette,
        tokens: mergeThemeTokens(baseTokens(scheme), palette.overrides[scheme]),
      })),
    [palettes, scheme],
  );

  const needle = query.trim().toLowerCase();
  const matches =
    needle === ""
      ? cards
      : cards.filter(
          (card) =>
            card.palette.name.toLowerCase().includes(needle) ||
            card.palette.blurb.toLowerCase().includes(needle),
        );
  const shown = matches.slice(0, visible);

  return (
    <SettingsGroup
      index={index}
      defaultOpen={defaultOpen}
      meta={{
        title: "Theme presets",
        blurb: "Apply one, or take just the parts you want.",
        icon: PaintBucketIcon,
      }}
    >
      <CurrentTheme saved={isSaved(paletteId ?? "")} />

      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          size={15}
          strokeWidth={1.5}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
        />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder={`Search ${cards.length} themes`}
          aria-label="Search themes"
          className="pl-9"
        />
      </div>

      {shown.length === 0 ? (
        <p className="px-1 py-6 text-center text-[0.75rem] text-text-muted">
          No theme matches “{query.trim()}”.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {shown.map((card, position) => (
          <PaletteCard
            key={card.palette.id}
            palette={card.palette}
            tokens={card.tokens}
            index={position}
            selected={(paletteId ?? "") === card.palette.id}
            onMerge={
              card.palette.id === ""
                ? null
                : () => {
                    setMerging(card.palette);
                    setMergeOpen(true);
                  }
            }
            onApply={() => {
              const next = card.palette.id === "" ? null : card.palette.id;
              applyPalette(next);
              toast.success(`${card.palette.name} applied`, {
                description:
                  next === null
                    ? "Back to the designed theme."
                    : "Every token moved. Tweak anything below it.",
              });
            }}
          />
        ))}
      </div>

      {matches.length > shown.length ? (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          onClick={() => setVisible((current) => current + PAGE_SIZE)}
        >
          Load {Math.min(PAGE_SIZE, matches.length - shown.length)} more of {matches.length}
        </Button>
      ) : null}

      <MergePaletteDialog
        key={merging?.id ?? ""}
        palette={merging}
        open={mergeOpen}
        onOpenChange={setMergeOpen}
      />
    </SettingsGroup>
  );
}
