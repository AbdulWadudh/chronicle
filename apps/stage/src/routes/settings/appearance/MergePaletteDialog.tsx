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
import { Switch } from "~/components/ui/switch";
import { useThemeStore } from "~/theme/store";
import { COLOR_SECTION_TITLES, MERGE_SECTIONS } from "./tokens";

export interface MergePaletteDialogProps {
  palette: ThemePalette | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MergePaletteDialog({ palette, open, onOpenChange }: MergePaletteDialogProps) {
  const mergePalette = useThemeStore((state) => state.mergePalette);
  const [taken, setTaken] = useState<readonly string[]>(COLOR_SECTION_TITLES);

  const sections = MERGE_SECTIONS.filter((section) =>
    section.keys.some((key) => palette?.overrides.dark[key] !== undefined),
  );
  const chosen = sections.filter((section) => taken.includes(section.title));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Take from {palette?.name ?? "this preset"}</DialogTitle>
          <DialogDescription>Anything you leave off keeps its current value.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="flex flex-col gap-2">
            {sections.map((section) => (
              <div
                key={section.title}
                className="raise flex items-center gap-4 rounded-control border-(length:--border-width-card) border-hairline bg-raised px-3.5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8125rem] font-medium text-text-primary">{section.title}</p>
                  <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-text-muted">
                    {section.hint}
                  </p>
                </div>
                <Switch
                  checked={taken.includes(section.title)}
                  aria-label={`Take ${section.title}`}
                  onCheckedChange={(next) =>
                    setTaken((current) =>
                      next
                        ? [...current, section.title]
                        : current.filter((title) => title !== section.title),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>Cancel</DialogClose>
          <Button
            size="sm"
            disabled={palette === null || chosen.length === 0}
            onClick={() => {
              if (palette === null) return;
              mergePalette(
                palette.id,
                chosen.flatMap((section) => [...section.keys]),
              );
              onOpenChange(false);
              toast.success(`${palette.name} merged in`, {
                description: `${chosen.map((section) => section.title.toLowerCase()).join(", ")} now come from it.`,
              });
            }}
          >
            {chosen.length === 0 ? "Pick a section" : `Take ${chosen.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
