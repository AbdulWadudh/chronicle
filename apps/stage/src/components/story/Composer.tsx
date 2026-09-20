import type { ComposeMode, TurnChoice } from "@chronicle/utils";
import { ArrowRight02Icon, ArrowUp02Icon, Idea01Icon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type CSSProperties, type KeyboardEvent, useState } from "react";
import { FieldActions } from "~/components/common/FieldActions";
import { WhisperCard } from "~/components/story/WhisperCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Tooltip } from "~/components/ui/tooltip";
import { useThemeTokens } from "~/theme/ThemeEngine";

const DRAFT_STYLE = { fieldSizing: "content", minHeight: 52, maxHeight: 132 } as const;

export interface ComposerProps {
  choices: readonly TurnChoice[];
  busy: boolean;
  composing: ComposeMode | null;
  whisper: string;
  composingWhisper: ComposeMode | null;
  onWhisperChange: (whisper: string) => void;
  onComposeWhisper: (mode: ComposeMode, draft: string) => Promise<string | null>;
  onSelectChoice: (choiceIndex: 0 | 1 | 2) => void;
  onSubmitAction: (action: string) => void;
  onCompose: (mode: ComposeMode, draft: string) => Promise<string | null>;
  onAbort: () => void;
}

interface ChoiceRowProps {
  choice: TurnChoice;
  index: number;
  onPress: () => void;
}

function ChoiceRow({ choice, index, onPress }: ChoiceRowProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{ "--rise-index": index } as CSSProperties}
      className="pressable rise-in group flex items-start gap-3 rounded-card border-(length:--border-width-card) border-primary/25 bg-linear-to-r from-primary/12 via-accent/8 to-transparent px-4 py-3 text-left transition-colors hover:border-primary/55 motion-reduce:transition-none"
    >
      <HugeiconsIcon
        icon={ArrowRight02Icon}
        size={15}
        strokeWidth={2}
        className="mt-0.5 shrink-0 text-text-accent"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.9375rem] leading-snug font-medium text-text-primary">
          {choice.label}
        </span>
        {choice.hint.length === 0 ? null : (
          <span className="text-[0.75rem] leading-snug text-text-muted">{choice.hint}</span>
        )}
      </span>
    </button>
  );
}

export function Composer({
  choices,
  busy,
  composing,
  whisper,
  composingWhisper,
  onWhisperChange,
  onComposeWhisper,
  onSelectChoice,
  onSubmitAction,
  onCompose,
  onAbort,
}: ComposerProps) {
  const tokens = useThemeTokens();
  const [draft, setDraft] = useState("");
  const [showChoices, setShowChoices] = useState(false);
  const ready = draft.trim().length > 0 && !busy && composing === null;
  const offering = choices.length > 0 && !busy;

  function submit(): void {
    if (!ready) return;
    onSubmitAction(draft.trim());
    setDraft("");
    setShowChoices(false);
  }

  function choose(choiceIndex: 0 | 1 | 2): void {
    setShowChoices(false);
    onSelectChoice(choiceIndex);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    submit();
  }

  async function compose(mode: ComposeMode): Promise<void> {
    const value = await onCompose(mode, draft.trim());
    if (value !== null) setDraft(value);
  }

  return (
    <div className="flex w-full max-w-170 flex-col gap-2.5 self-center px-4 pt-3 pb-4">
      {offering ? (
        <div
          className={showChoices ? "flex flex-col gap-2" : "hidden md:flex md:flex-col md:gap-2"}
        >
          {choices.slice(0, 3).map((choice, index) => (
            <ChoiceRow
              key={choice.label}
              choice={choice}
              index={index}
              onPress={() => choose(index as 0 | 1 | 2)}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col rounded-card border-(length:--border-width-card) border-card-border bg-input-surface transition-colors focus-within:border-primary/60 motion-reduce:transition-none">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={offering ? "or type any action you want…" : "What do you do?"}
          rows={1}
          disabled={busy || composing !== null}
          aria-label="Your action"
          style={DRAFT_STYLE}
          className="rounded-none border-transparent bg-transparent px-4 pt-3.5 pb-1 text-[0.9375rem] leading-[22px] focus:border-transparent"
        />

        <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
          <div className="flex items-center gap-1">
            <FieldActions
              label="action"
              busyMode={composing}
              canEnhance={draft.trim().length > 0}
              disabled={busy}
              onCompose={(mode) => void compose(mode)}
            />
            {offering ? (
              <Tooltip
                content={showChoices ? "Hide suggestions" : `Show ${choices.length} suggestions`}
              >
                <Button
                  variant="outline"
                  size="iconSm"
                  onClick={() => setShowChoices((open) => !open)}
                  aria-expanded={showChoices}
                  aria-label={showChoices ? "Hide suggestions" : "Show suggestions"}
                  className={`md:hidden ${
                    showChoices
                      ? "border-primary/60 bg-primary/15 text-text-accent"
                      : "border-primary/30 bg-raised-hover text-text-accent hover:border-primary/60 hover:text-text-accent"
                  }`}
                >
                  <HugeiconsIcon icon={Idea01Icon} size={13} strokeWidth={1.75} />
                </Button>
              </Tooltip>
            ) : null}
            <WhisperCard
              whisper={whisper}
              disabled={busy}
              composing={composingWhisper}
              onCompose={onComposeWhisper}
              onChange={onWhisperChange}
            />
          </div>

          {busy ? (
            <button
              type="button"
              onClick={onAbort}
              aria-label="Stop generating"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-secondary"
            >
              <HugeiconsIcon
                icon={StopIcon}
                size={16}
                strokeWidth={2}
                color={tokens.textSecondary}
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!ready}
              aria-label="Send action"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control transition active:scale-95 motion-reduce:transition-none ${
                ready ? "bg-primary" : "bg-sunken"
              }`}
            >
              <HugeiconsIcon
                icon={ArrowUp02Icon}
                size={17}
                strokeWidth={2.25}
                color={ready ? tokens.primaryForeground : tokens.textMuted}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
