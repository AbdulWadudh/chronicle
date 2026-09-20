import { API, type ThemeTokens } from "@chronicle/config";
import type { ThemePalette } from "@chronicle/utils";
import {
  Alert02Icon,
  Delete02Icon,
  FloppyDiskIcon,
  PencilEdit02Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { AlertDialog } from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { patch, remove } from "~/lib/api";
import { useThemeStore } from "~/theme/store";
import { EditList } from "./EditList";
import { usePendingEdits } from "./pendingEdits";
import { RenamePaletteDialog } from "./RenamePaletteDialog";
import { SaveThemeDialog } from "./SaveThemeDialog";
import { PANEL } from "./styles";

function currentOverrides(
  source: ThemePalette | undefined,
  custom: Record<"dark" | "light", Partial<ThemeTokens>>,
): ThemePalette["overrides"] {
  return {
    dark: { ...source?.overrides.dark, ...custom.dark },
    light: { ...source?.overrides.light, ...custom.light },
  };
}

export function CurrentTheme({ saved }: { saved: boolean }) {
  const palettes = useThemeStore((state) => state.palettes);
  const paletteId = useThemeStore((state) => state.paletteId);
  const customOverrides = useThemeStore((state) => state.customOverrides);
  const setPalettes = useThemeStore((state) => state.setPalettes);
  const applyPalette = useThemeStore((state) => state.applyPalette);

  const [savingOpen, setSavingOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const active = palettes.find((one) => one.id === paletteId);
  const edits = usePendingEdits();

  return (
    <div className={`${PANEL} gap-3`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">
            {active?.name ?? "Chronicle"}
            <span className="rounded-(--radius-control) bg-primary/15 px-1.5 py-0.5 text-[0.5625rem] font-medium tracking-[0.08em] text-text-accent uppercase">
              {saved ? "Yours" : "Built in"}
            </span>
          </p>
          <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
            {active?.blurb ?? "The designed theme. Gold on ink, soft glass, generous corners."}
            {edits.length === 0
              ? ""
              : ` · ${edits.length} unsaved edit${edits.length === 1 ? "" : "s"}.`}
          </p>
        </div>

        <div className="ms-auto flex shrink-0 flex-wrap justify-end gap-1.5">
          <Tooltip content={edits.length === 0 ? "Change something first" : "Save as new"}>
            <Button
              size="iconSm"
              disabled={edits.length === 0}
              aria-label="Save the current appearance as a new theme"
              onClick={() => setSavingOpen(true)}
            >
              <HugeiconsIcon icon={FloppyDiskIcon} size={13} strokeWidth={1.8} />
            </Button>
          </Tooltip>
          {saved ? (
            <>
              <Tooltip
                content={edits.length === 0 ? "Change something first" : "Update to current"}
              >
                <Button
                  variant="outline"
                  size="iconSm"
                  disabled={edits.length === 0}
                  aria-label="Update this theme to the current appearance"
                  onClick={() => setUpdateOpen(true)}
                >
                  <HugeiconsIcon icon={Refresh01Icon} size={13} strokeWidth={1.8} />
                </Button>
              </Tooltip>
              <Tooltip content="Rename">
                <Button
                  variant="outline"
                  size="iconSm"
                  aria-label="Rename this theme"
                  onClick={() => setRenameOpen(true)}
                >
                  <HugeiconsIcon icon={PencilEdit02Icon} size={13} strokeWidth={1.8} />
                </Button>
              </Tooltip>
              <Tooltip content="Delete">
                <Button
                  variant="outline"
                  size="iconSm"
                  aria-label="Delete this theme"
                  onClick={() => setDeleteOpen(true)}
                  className="border-danger/40 text-danger hover:border-danger/70 hover:text-danger"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={13} strokeWidth={1.8} />
                </Button>
              </Tooltip>
            </>
          ) : null}
        </div>
      </div>

      <SaveThemeDialog open={savingOpen} onOpenChange={setSavingOpen} />

      <RenamePaletteDialog
        key={active?.id ?? ""}
        palette={active ?? null}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />

      <AlertDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        tone="default"
        title={`Overwrite ${active?.name ?? "this theme"}?`}
        description={`Replaces what ${active?.name ?? "it"} holds with the appearance you are looking at now. The old values are gone.`}
        confirmLabel="Overwrite it"
        icon={<HugeiconsIcon icon={Alert02Icon} size={17} strokeWidth={1.8} />}
        onConfirm={() => {
          if (active === undefined) return;
          patch<{ palette: ThemePalette }>(`${API.themes}/${active.id}`, {
            overrides: currentOverrides(active, customOverrides),
          })
            .then((body) => {
              setPalettes(palettes.map((one) => (one.id === body.palette.id ? body.palette : one)));
              toast.success(`${body.palette.name} updated`, {
                description: "It now holds what you are looking at.",
              });
            })
            .catch(() => toast.error("Could not update that theme"));
        }}
      >
        <EditList edits={edits} />
      </AlertDialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${active?.name ?? "this theme"}?`}
        description="It leaves the gallery for good and the interface falls back to the designed theme. Built-in presets are untouched."
        confirmLabel="Delete it"
        icon={<HugeiconsIcon icon={Delete02Icon} size={17} strokeWidth={1.8} />}
        onConfirm={() => {
          if (active === undefined) return;
          const name = active.name;
          remove(`${API.themes}/${active.id}`)
            .then(() => {
              setPalettes(palettes.filter((one) => one.id !== active.id));
              applyPalette(null);
              toast.success(`${name} deleted`, { description: "Back to the designed theme." });
            })
            .catch(() => toast.error("Could not delete that theme"));
        }}
      />
    </div>
  );
}
