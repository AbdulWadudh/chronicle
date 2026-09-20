import type { ComposeMode } from "@chronicle/utils";
import { PaintBrush01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ComposableField } from "~/components/common/ComposableField";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";

export interface ScenePromptCardProps {
  seed: string;
  busy: boolean;
  composing: ComposeMode | null;
  onCompose: (mode: ComposeMode, draft: string) => Promise<string | null>;
  onPaint: (prompt: string | null) => void;
}

export function ScenePromptCard({
  seed,
  busy,
  composing,
  onCompose,
  onPaint,
}: ScenePromptCardProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(seed);

  async function compose(mode: ComposeMode): Promise<void> {
    const value = await onCompose(mode, draft.trim());
    if (value !== null) setDraft(value);
  }

  function paint(prompt: string | null): void {
    onPaint(prompt);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next: boolean) => {
        if (next) setDraft(seed);
        setOpen(next);
      }}
    >
      <Tooltip content="Paint this scene again">
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              disabled={busy}
              aria-label="Paint this scene again"
              className="border-hairline-strong bg-card/85 text-text-accent backdrop-blur-sm hover:border-primary/50"
            >
              <HugeiconsIcon icon={PaintBrush01Icon} size={15} strokeWidth={2} />
            </Button>
          }
        />
      </Tooltip>

      <PopoverContent align="end" className="flex w-80 max-w-[85vw] flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[0.875rem] font-semibold text-text-primary">Repaint this scene</h3>
          <p className="text-[0.6875rem] leading-relaxed text-text-muted">
            Paint it again from the passage, or describe what you want to see instead.
          </p>
        </div>

        <ComposableField
          id="scene-prompt"
          actionNoun="scene prompt"
          ariaLabel="Scene prompt"
          value={draft}
          placeholder="Rain on black water, a lantern, one figure waist deep…"
          rows={4}
          busyMode={composing}
          disabled={busy}
          onChange={setDraft}
          onCompose={(mode) => void compose(mode)}
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || composing !== null}
            onClick={() => paint(null)}
          >
            Auto
          </Button>
          <Button
            size="sm"
            disabled={busy || composing !== null || draft.trim().length === 0}
            onClick={() => paint(draft.trim())}
          >
            Paint
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
