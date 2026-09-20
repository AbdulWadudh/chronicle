import { RefreshIcon, RepeatIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertDialog } from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { useCustomOverrides, useThemeStore } from "~/theme/store";
import { PANEL } from "./styles";

export function ResetTheme({ index }: { index: number }) {
  const resetTheme = useThemeStore((state) => state.resetTheme);
  const paletteId = useThemeStore((state) => state.paletteId);
  const overrides = useCustomOverrides();
  const [confirming, setConfirming] = useState(false);

  const changed = useMemo(() => Object.keys(overrides).length, [overrides]);
  const nothingToDo = changed === 0 && paletteId === null;

  return (
    <div
      style={{ ["--rise-index" as string]: index }}
      className={`${PANEL} rise-in flex-row items-center justify-between gap-4`}
    >
      <div className="min-w-0">
        <p className="text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">
          Restore the designed theme
        </p>
        <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
          Drops the preset and every edit on this device.
        </p>
      </div>

      <Button
        variant="destructive"
        size="sm"
        disabled={nothingToDo}
        onClick={() => setConfirming(true)}
        className="gap-1.5"
      >
        <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={1.5} />
        Reset all
      </Button>

      <AlertDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Reset every appearance change?"
        description={`This drops the chosen preset and ${changed === 0 ? "any" : changed} edited token${changed === 1 ? "" : "s"} across both the dark and light schemes on this device. It cannot be undone, and runtime settings are untouched.`}
        confirmLabel="Reset appearance"
        icon={<HugeiconsIcon icon={RepeatIcon} size={17} strokeWidth={1.8} />}
        onConfirm={() => {
          resetTheme();
          toast.success("Appearance reset", { description: "Back to the designed theme." });
        }}
      />
    </div>
  );
}
