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
import { patch } from "~/lib/api";
import { useThemeStore } from "~/theme/store";

export interface RenamePaletteDialogProps {
  palette: ThemePalette | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenamePaletteDialog({ palette, open, onOpenChange }: RenamePaletteDialogProps) {
  const palettes = useThemeStore((state) => state.palettes);
  const setPalettes = useThemeStore((state) => state.setPalettes);
  const [name, setName] = useState(palette?.name ?? "");
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim();

  function rename(): void {
    if (palette === null || trimmed === "") return;
    setBusy(true);
    patch<{ palette: ThemePalette }>(`${API.themes}/${palette.id}`, { name: trimmed })
      .then((body) => {
        setPalettes(palettes.map((one) => (one.id === body.palette.id ? body.palette : one)));
        onOpenChange(false);
        toast.success(`Renamed to ${body.palette.name}`);
      })
      .catch(() =>
        toast.error("Could not rename that theme", {
          description: "Built-in presets cannot be renamed.",
        }),
      )
      .finally(() => setBusy(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename {palette?.name ?? "this theme"}</DialogTitle>
          <DialogDescription>Only the name changes, every token stays put.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rename-theme">Name</Label>
            <Input
              id="rename-theme"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              autoComplete="off"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>Cancel</DialogClose>
          <Button size="sm" disabled={busy || trimmed === ""} onClick={rename}>
            {busy ? "Renaming" : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
