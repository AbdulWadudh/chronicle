import type { ComposeMode } from "@chronicle/utils";
import { MaskIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ComposableField } from "~/components/common/ComposableField";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";

export interface WhisperCardProps {
  whisper: string;
  disabled: boolean;
  composing: ComposeMode | null;
  onCompose: (mode: ComposeMode, draft: string) => Promise<string | null>;
  onChange: (whisper: string) => void;
}

export function WhisperCard({
  whisper,
  disabled,
  composing,
  onCompose,
  onChange,
}: WhisperCardProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(whisper);
  const armed = whisper.trim().length > 0;

  async function compose(mode: ComposeMode): Promise<void> {
    const value = await onCompose(mode, draft.trim());
    if (value !== null) setDraft(value);
  }

  function commit(next: string): void {
    onChange(next);
    setDraft(next);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next: boolean) => {
        if (next) setDraft(whisper);
        setOpen(next);
      }}
    >
      <Tooltip content={armed ? `Next turn is whispered: ${whisper}` : "Whisper to the director"}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="iconSm"
              disabled={disabled}
              aria-label={armed ? `Director's whisper set: ${whisper}` : "Set a director's whisper"}
              className={
                armed
                  ? "border-accent/60 bg-accent/15 text-accent hover:border-accent hover:text-accent"
                  : "border-primary/30 bg-raised-hover text-text-accent hover:border-primary/60 hover:text-text-accent"
              }
            >
              <HugeiconsIcon icon={MaskIcon} size={13} strokeWidth={1.75} />
            </Button>
          }
        />
      </Tooltip>

      <PopoverContent align="start" className="flex w-80 max-w-[85vw] flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[0.875rem] font-semibold text-text-primary">Director's whisper</h3>
          <p className="text-[0.6875rem] leading-relaxed text-text-muted">
            A hidden instruction the game master follows on your next turn. Your character never
            hears it.
          </p>
        </div>

        <ComposableField
          id="director-whisper"
          actionNoun="whisper"
          ariaLabel="Director's whisper"
          value={draft}
          placeholder="Someone she owes money to walks in…"
          rows={3}
          busyMode={composing}
          onChange={setDraft}
          onCompose={(mode) => void compose(mode)}
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={composing !== null || !armed}
            onClick={() => commit("")}
          >
            Clear
          </Button>
          <Button size="sm" disabled={composing !== null} onClick={() => commit(draft.trim())}>
            Set for next turn
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
