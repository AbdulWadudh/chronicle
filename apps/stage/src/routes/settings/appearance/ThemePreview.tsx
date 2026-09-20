import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  DiceIcon,
  LayersLogoIcon,
  PlayIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { useResolvedTheme } from "~/theme/store";

const STATUS = [
  { key: "success", label: "Succeeded", icon: CheckmarkCircle02Icon, tone: "text-success" },
  { key: "warning", label: "Partial", icon: Alert02Icon, tone: "text-warning" },
  { key: "danger", label: "Failed", icon: Alert02Icon, tone: "text-danger" },
] as const;

const SWATCHES = ["canvas", "card", "primary", "accent", "secondary"] as const;

export function ThemePreview() {
  const tokens = useResolvedTheme();
  const [pulse, setPulse] = useState(true);
  const [threshold, setThreshold] = useState(14);
  const [overlayOpen, setOverlayOpen] = useState(false);

  return (
    <section
      aria-label="Live preview"
      className="raise overflow-hidden rounded-card border-(length:--border-width-card) border-card-border bg-card"
    >
      <header className="flex items-center justify-between gap-3 border-b border-hairline bg-raised px-4 py-2.5">
        <span className="flex items-center gap-2 text-[0.75rem] font-medium text-text-secondary">
          <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={1.8} className="text-primary" />
          Live preview
        </span>
        <span className="font-mono text-[0.625rem] tracking-wide text-text-muted uppercase">
          {tokens.mode}
        </span>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <div>
          <h3 className="text-[1.125rem] font-semibold tracking-[-0.02em] text-text-primary">
            The lantern gutters
          </h3>
          <p
            className="mt-1 text-[0.875rem] text-text-secondary"
            style={{
              fontFamily: "var(--font-narrative)",
              lineHeight: "var(--leading-narrative)",
            }}
          >
            Rain finds the gap in the roof and the fire answers it. Whatever followed you through
            the pass has stopped moving, which is worse than hearing it walk.
          </p>
          <p className="mt-1.5 text-[0.75rem] text-text-muted">
            Muted text sits here, a step quieter than the prose above it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">
            <HugeiconsIcon icon={PlayIcon} size={13} strokeWidth={2} />
            Continue
          </Button>
          <Button size="sm" variant="secondary">
            Secondary
          </Button>
          <Button size="sm" variant="outline">
            Outline
          </Button>
          <Button size="sm" variant="ghost">
            Ghost
          </Button>
          <Button size="sm" variant="destructive">
            Delete
          </Button>
          <Button size="sm" disabled>
            Disabled
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOverlayOpen(true)}>
            <HugeiconsIcon icon={LayersLogoIcon} size={13} strokeWidth={2} />
            Overlay
          </Button>
        </div>

        <Dialog open={overlayOpen} onOpenChange={setOverlayOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Blur and glass live here</DialogTitle>
              <DialogDescription>
                Backdrop blur is {String(tokens.blurIntensity)}px and glass opacity is{" "}
                {String(tokens.glassOpacity)}. Drag either slider with this open and watch the page
                behind it change.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <p className="text-[0.8125rem] leading-relaxed text-text-secondary">
                Only floating surfaces use those two tokens — this dialog, the scrim behind it,
                selects and popovers. Nothing flat on the page does, which is why moving the sliders
                looks like it does nothing until something is open.
              </p>
            </DialogBody>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm" />}>Close</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Input defaultValue="Kestrel of the Ninth" aria-label="Preview input" />
            <div className="flex items-center gap-3">
              <Slider
                value={threshold}
                min={1}
                max={20}
                step={1}
                onValueChange={(next) => {
                  if (typeof next === "number") setThreshold(next);
                }}
                aria-label="Preview difficulty"
              />
              <span className="w-8 shrink-0 text-right font-mono text-[0.75rem] tabular-nums text-text-primary">
                {threshold}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-3 rounded-control border-(length:--border-width-card) border-hairline bg-raised px-3 py-2">
              <span className="text-[0.75rem] text-text-secondary">Ambience</span>
              <Switch checked={pulse} onCheckedChange={setPulse} aria-label="Preview toggle" />
            </div>
            <div className="flex items-center gap-2 rounded-control border-(length:--border-width-card) border-hairline bg-audio-pill-bg px-3 py-2">
              <HugeiconsIcon
                icon={DiceIcon}
                size={14}
                strokeWidth={1.8}
                className="text-text-accent"
              />
              <span className="font-mono text-[0.6875rem] text-text-primary">
                d20 → {threshold} vs dc 12
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS.map((status) => (
            <span
              key={status.key}
              className={`inline-flex items-center gap-1.5 rounded-control border-(length:--border-width-card) border-hairline bg-sunken px-2.5 py-1 text-[0.6875rem] ${status.tone}`}
            >
              <HugeiconsIcon icon={status.icon} size={12} strokeWidth={2} />
              {status.label}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {SWATCHES.map((key) => (
            <span
              key={key}
              title={key}
              className="h-7 flex-1 rounded-control border-(length:--border-width-card) border-hairline"
              style={{ backgroundColor: String(tokens[key]) }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
