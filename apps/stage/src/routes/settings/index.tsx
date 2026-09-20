import { ArrowRight01Icon, PuzzleIcon, SlidersHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { BackButton } from "~/components/common/BackButton";
import { PageHeader } from "~/components/common/PageHeader";
import { Screen } from "~/components/common/Screen";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Select } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import type { ToastPosition } from "~/theme/store";
import { useThemeStore } from "~/theme/store";
import {
  PANEL,
  ResetTheme,
  SPLIT,
  ThemeColors,
  ThemeMode,
  ThemePalettes,
  ThemePreview,
  ThemeShape,
  ThemeTypography,
} from "./appearance";

const TOAST_SPOTS = [
  { label: "Bottom right", value: "bottom-right" },
  { label: "Bottom centre", value: "bottom-center" },
  { label: "Bottom left", value: "bottom-left" },
  { label: "Top right", value: "top-right" },
  { label: "Top centre", value: "top-center" },
  { label: "Top left", value: "top-left" },
] as const satisfies readonly { label: string; value: ToastPosition }[];

const TOAST_KINDS = [
  {
    label: "Success",
    tone: "border-success/40 bg-success/10 text-success hover:border-success/70 hover:bg-success/15 hover:text-success",
    fire: () => toast.success("World saved", { description: "Every turn is on disk." }),
  },
  {
    label: "Error",
    tone: "border-danger/40 bg-danger/10 text-danger hover:border-danger/70 hover:bg-danger/15 hover:text-danger",
    fire: () =>
      toast.error("Could not reach the director", { description: "Start it and try again." }),
  },
  {
    label: "Warning",
    tone: "border-warning/40 bg-warning/10 text-warning hover:border-warning/70 hover:bg-warning/15 hover:text-warning",
    fire: () =>
      toast.warning("Diffusion is queued", {
        description: "The GPU is busy with an earlier turn.",
      }),
  },
  {
    label: "Info",
    tone: "border-accent/40 bg-accent/10 text-text-accent hover:border-accent/70 hover:bg-accent/15 hover:text-text-accent",
    fire: () =>
      toast.info("Cinema Mode is on", { description: "Tap the passage to reveal all of it." }),
  },
] as const;

export function Settings() {
  const navigate = useNavigate();
  const cinemaMode = useThemeStore((state) => state.cinemaMode);
  const toggleCinemaMode = useThemeStore((state) => state.toggleCinemaMode);
  const toastPosition = useThemeStore((state) => state.toastPosition);
  const setToastPosition = useThemeStore((state) => state.setToastPosition);
  const toastSpot = TOAST_SPOTS.find((spot) => spot.value === toastPosition) ?? TOAST_SPOTS[0];

  return (
    <Screen width="wide">
      <PageHeader title="Settings" leading={<BackButton onPress={() => void navigate(-1)} />} />

      <ScrollArea className="-mr-3 min-h-0 flex-1 pr-3">
        <div className="flex flex-col gap-4 pr-[calc(var(--shadow-offset)+0.25rem)] pb-8">
          <div className="sm:sticky sm:top-0 sm:z-20">
            <ThemePreview />
          </div>

          <ThemeMode index={0} />

          <ThemePalettes index={1} defaultOpen={false} />

          <ThemeShape index={2} defaultOpen={false} />

          <ThemeColors index={3} defaultOpen={false} />
          <ThemeTypography index={4} defaultOpen={false} />

          <SettingsGroup
            index={5}
            defaultOpen={false}
            meta={{
              title: "Miscellaneous",
              blurb: "Playback and notifications.",
              icon: PuzzleIcon,
            }}
          >
            <div className={`${PANEL} ${SPLIT}`}>
              <div className="min-w-0">
                <Label htmlFor="cinema-mode">Cinema Mode</Label>
                <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
                  Reveals narration one sentence at a time, paced by its audio.
                </p>
              </div>
              <div className="flex justify-end">
                <Switch
                  id="cinema-mode"
                  checked={cinemaMode}
                  onCheckedChange={toggleCinemaMode}
                  aria-label="Cinema Mode"
                />
              </div>
            </div>

            <div className={PANEL}>
              <div className={SPLIT}>
                <div className="min-w-0">
                  <p className="text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">
                    Toast corner
                  </p>
                  <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
                    Where notifications appear.
                  </p>
                </div>
                <Select
                  value={toastSpot.label}
                  groups={[{ values: TOAST_SPOTS.map((spot) => spot.label) }]}
                  ariaLabel="Toast corner"
                  onValueChange={(next) => {
                    const spot = TOAST_SPOTS.find((one) => one.label === next);
                    if (spot !== undefined) setToastPosition(spot.value);
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline pt-2.5">
                <span className="mr-1 text-[0.6875rem] text-text-muted">Try one</span>
                {TOAST_KINDS.map((kind) => (
                  <Button
                    key={kind.label}
                    variant="outline"
                    size="sm"
                    onClick={kind.fire}
                    className={kind.tone}
                  >
                    {kind.label}
                  </Button>
                ))}
              </div>
            </div>
          </SettingsGroup>

          <ResetTheme index={6} />

          <button
            type="button"
            onClick={() => void navigate("/admin")}
            className={`${PANEL} pressable flex-row items-center gap-3 text-left hover:border-hairline-strong hover:bg-raised-hover`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-(--radius-control) border-(length:--border-width-card) border-hairline bg-sunken text-text-muted">
              <HugeiconsIcon icon={SlidersHorizontalIcon} size={17} strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.875rem] font-medium text-text-primary">
                Runtime settings
              </span>
              <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-text-muted">
                Model, prompt, illustration and dice tuning. These live on the server and change the
                behaviour for every session, not just this device.
              </span>
            </span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              strokeWidth={1.5}
              className="shrink-0 text-text-muted"
            />
          </button>
        </div>
      </ScrollArea>
    </Screen>
  );
}
