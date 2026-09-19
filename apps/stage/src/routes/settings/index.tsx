import { ArrowRight01Icon, SlidersHorizontalIcon, TvSmartIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "react-router";
import { BackButton } from "~/components/common/BackButton";
import { PageHeader } from "~/components/common/PageHeader";
import { Screen } from "~/components/common/Screen";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Switch } from "~/components/ui/switch";
import { useThemeStore } from "~/theme/store";
import { ThemeColors, ThemeShape, ThemeTypography } from "./appearance";

const PANEL =
  "flex flex-col gap-2.5 rounded-[var(--radius-card)] border-[length:var(--border-width-card)] border-hairline bg-raised px-4 py-3.5";
const SPLIT = "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,340px)] sm:items-center sm:gap-8";

export function Settings() {
  const navigate = useNavigate();
  const cinemaMode = useThemeStore((state) => state.cinemaMode);
  const toggleCinemaMode = useThemeStore((state) => state.toggleCinemaMode);

  return (
    <Screen width="wide">
      <PageHeader title="Settings" leading={<BackButton onPress={() => void navigate(-1)} />} />

      <ScrollArea className="-mr-3 min-h-0 flex-1 pr-3">
        <div className="flex flex-col gap-4 pb-8">
          <SettingsGroup
            index={0}
            meta={{
              title: "Playback",
              blurb: "How a turn reveals itself while you read it.",
              icon: TvSmartIcon,
            }}
          >
            <div className={`${PANEL} ${SPLIT}`}>
              <div className="min-w-0">
                <Label htmlFor="cinema-mode">Cinema Mode</Label>
                <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
                  Reveal the narration one sentence at a time, paced by its audio instead of a
                  timer. Tap the passage to show all of it at once.
                </p>
              </div>
              <div className="flex sm:justify-end">
                <Switch
                  id="cinema-mode"
                  checked={cinemaMode}
                  onCheckedChange={toggleCinemaMode}
                  aria-label="Cinema Mode"
                />
              </div>
            </div>
          </SettingsGroup>

          <ThemeColors index={1} />
          <ThemeTypography index={2} />
          <ThemeShape index={3} />

          <button
            type="button"
            onClick={() => void navigate("/admin")}
            className={`${PANEL} flex-row items-center gap-3 text-left transition-colors duration-200 hover:border-hairline-strong hover:bg-raised-hover motion-reduce:transition-none`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border-[length:var(--border-width-card)] border-hairline bg-sunken text-text-muted">
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
