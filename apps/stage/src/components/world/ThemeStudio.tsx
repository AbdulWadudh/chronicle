import type { ThemeScheme } from "@chronicle/config";
import type { PaletteOverrides } from "@chronicle/utils";
import {
  Cancel01Icon,
  Moon02Icon,
  PaintBoardIcon,
  RefreshIcon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Segmented, type SegmentedOption } from "~/components/ui/segmented";
import { ThemeStudioSections } from "~/components/world/ThemeStudioSections";
import { EMPTY_WORLD_THEME, useEffectiveScheme, useThemeStore } from "~/theme/store";
import { useThemeTarget } from "~/theme/useThemeTarget";

const SCHEMES: readonly SegmentedOption<ThemeScheme>[] = [
  { value: "dark", label: "Dark", icon: Moon02Icon },
  { value: "light", label: "Light", icon: Sun03Icon },
];

export interface ThemeStudioProps {
  open: boolean;
  worldId: string | null;
  worldTitle: string;
  worldTheme: PaletteOverrides | null;
  onWorldThemeChange: (next: PaletteOverrides) => void;
  onClose: () => void;
}

export function ThemeStudio({
  open,
  worldId,
  worldTitle,
  worldTheme,
  onWorldThemeChange,
  onClose,
}: ThemeStudioProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const target = useThemeTarget("mine", worldId, worldTheme, onWorldThemeChange);
  const scheme = useEffectiveScheme();
  const setWorldMode = useThemeStore((state) => state.setWorldMode);
  const worldOverrides = useThemeStore((state) => state.worldOverrides);
  const _localTheme =
    worldId === null ? EMPTY_WORLD_THEME : (worldOverrides[worldId] ?? EMPTY_WORLD_THEME);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const edited = Object.keys(target.overrides).length;

  return (
    <dialog
      ref={ref}
      aria-label={`Theme studio for ${worldTitle}`}
      onClose={onClose}
      className="hidden h-dvh max-h-none w-dvw max-w-none border-0 bg-canvas p-0 text-text-primary backdrop:bg-scrim open:flex"
    >
      <div className="flex h-full w-full flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-card-border bg-raised px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-primary/15 bg-primary/[0.06] text-text-accent">
            <HugeiconsIcon icon={PaintBoardIcon} size={17} strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] font-semibold text-text-primary">
              Theme studio
            </span>
            <span className="block truncate text-[0.75rem] text-text-muted">{worldTitle}</span>
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Close the theme studio"
            onClick={onClose}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.5} />
          </Button>
        </header>

        <div className="shrink-0 border-b border-card-border px-4 py-3">
          <p className="text-[0.75rem] leading-relaxed text-text-muted">
            Kept on this device for you alone. Nobody else playing this world sees it.
          </p>

          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <p className="min-w-0 text-[0.75rem] leading-relaxed text-text-muted">
              Kept for this world alone. Your own theme elsewhere is untouched.
            </p>
            <Segmented
              value={scheme}
              options={SCHEMES}
              onValueChange={(next) => {
                if (worldId !== null) setWorldMode(worldId, next);
              }}
              ariaLabel="Which scheme you are editing"
              className="w-auto shrink-0"
            />
          </div>
        </div>

        <div className="scrollbar-none mx-auto flex w-full max-w-250 min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <ThemeStudioSections
            target={target}
            openSection={openSection}
            onOpenSection={setOpenSection}
          />
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-card-border px-4 py-3">
          <span className="text-[0.75rem] text-text-muted">
            {edited === 0
              ? "Nothing changed yet"
              : `${edited} token${edited === 1 ? "" : "s"} changed`}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={edited === 0}
            onClick={target.clearAll}
            className="gap-1.5"
          >
            <HugeiconsIcon icon={RefreshIcon} size={14} strokeWidth={1.5} />
            Reset my theme
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
