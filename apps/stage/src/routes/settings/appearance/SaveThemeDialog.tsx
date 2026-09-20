import { API } from "@chronicle/config";
import type { ThemePalette } from "@chronicle/utils";
import { useState } from "react";
import { toast } from "sonner";
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
import { Label } from "~/components/ui/label";
import { post } from "~/lib/api";
import { useThemeStore } from "~/theme/store";
import { EditList } from "./EditList";
import { usePendingEdits } from "./pendingEdits";

export interface SaveThemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveThemeDialog({ open, onOpenChange }: SaveThemeDialogProps) {
  const palettes = useThemeStore((state) => state.palettes);
  const paletteId = useThemeStore((state) => state.paletteId);
  const customOverrides = useThemeStore((state) => state.customOverrides);
  const setPalettes = useThemeStore((state) => state.setPalettes);
  const applyPalette = useThemeStore((state) => state.applyPalette);

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const edits = usePendingEdits();

  function save(): void {
    const source = palettes.find((one) => one.id === paletteId);
    setBusy(true);
    post<{ palette: ThemePalette }>(API.themes, {
      name: name.trim() === "" ? undefined : name.trim(),
      overrides: {
        dark: { ...source?.overrides.dark, ...customOverrides.dark },
        light: { ...source?.overrides.light, ...customOverrides.light },
      },
    })
      .then((body) => {
        setPalettes([...palettes, body.palette]);
        applyPalette(body.palette.id);
        onOpenChange(false);
        setName("");
        toast.success(`Saved as ${body.palette.name}`, {
          description: "It is in the gallery below, and now applied.",
        });
      })
      .catch(() =>
        toast.error("Could not save that theme", { description: "The director refused it." }),
      )
      .finally(() => setBusy(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save this theme</DialogTitle>
          <DialogDescription>
            Keeps every colour, corner and font exactly as it looks now.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="flex flex-col gap-2">
            <Label htmlFor="theme-name">Name</Label>
            <Input
              id="theme-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Leave empty and one will be invented"
              maxLength={60}
              autoComplete="off"
            />
            <p className="text-[0.6875rem] leading-relaxed text-text-muted">
              Leave it blank and the director names it for you.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[0.75rem] font-medium text-text-primary">
              {edits.length === 0
                ? "Your edits"
                : `${edits.length} edit${edits.length === 1 ? "" : "s"} on top of the preset`}
            </p>
            <EditList edits={edits} />
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>Cancel</DialogClose>
          <Button size="sm" disabled={busy} onClick={save}>
            {busy ? "Saving" : "Save theme"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
