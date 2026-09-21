import type { ComposeMode, TurnChoice } from "@chronicle/utils";
import { ArrowUp02Icon, Idea01Icon, RefreshIcon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ChangeEvent, type KeyboardEvent, useRef, useState } from "react";
import { FieldActions } from "~/components/common/FieldActions";
import { ChoiceRow, ChoiceSkeleton } from "~/components/story/ChoiceRow";
import { MentionMenu } from "~/components/story/MentionMenu";
import { useComposerMention } from "~/components/story/useComposerMention";
import { WhisperCard } from "~/components/story/WhisperCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Tooltip } from "~/components/ui/tooltip";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import type { CharacterSummary } from "~/lib/entities";
import { useThemeStore } from "~/theme/store";
import { useThemeTokens } from "~/theme/ThemeEngine";

const DRAFT_STYLE = { fieldSizing: "content", minHeight: 52, maxHeight: 132 } as const;

export interface ComposerProps {
  choices: readonly TurnChoice[];
  busy: boolean;
  composing: ComposeMode | null;
  whisper: string;
  composingWhisper: ComposeMode | null;
  cast?: readonly CharacterSummary[];
  isRerollingChoices?: boolean;
  onWhisperChange: (whisper: string) => void;
  onComposeWhisper: (mode: ComposeMode, draft: string) => Promise<string | null>;
  onSelectChoice: (choiceIndex: 0 | 1 | 2) => void;
  onSubmitAction: (action: string, mentionedCharacterIds?: string[]) => void;
  onCompose: (mode: ComposeMode, draft: string) => Promise<string | null>;
  onAbort: () => void;
  onRerollChoices?: () => void;
}

export function Composer({
  choices,
  busy,
  composing,
  whisper,
  composingWhisper,
  cast = [],
  isRerollingChoices = false,
  onWhisperChange,
  onComposeWhisper,
  onSelectChoice,
  onSubmitAction,
  onCompose,
  onAbort,
  onRerollChoices,
}: ComposerProps) {
  const tokens = useThemeTokens();
  const reduceMotion = useReducedMotion();
  const motionLevel = useThemeStore((state) => state.motionLevel);
  const immersive = useThemeStore((state) => state.immersive);
  const typing = immersive && !reduceMotion && motionLevel !== "off";
  const [draft, setDraft] = useState("");
  const [showChoices, setShowChoices] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mention = useComposerMention();
  const ready = draft.trim().length > 0 && !busy && composing === null;
  const offering = (choices.length > 0 && !busy) || isRerollingChoices;
  const filteredCast =
    mention.mentionQuery === null
      ? []
      : cast.filter((item) =>
          item.name.toLowerCase().includes(mention.mentionQuery?.toLowerCase() ?? ""),
        );

  function submit(): void {
    if (!ready) return;
    onSubmitAction(draft.trim(), [...mention.mentionedIds]);
    setDraft("");
    mention.clearMention();
    setShowChoices(false);
  }

  function choose(choiceIndex: 0 | 1 | 2): void {
    if (busy || isRerollingChoices) return;
    onSelectChoice(choiceIndex);
  }

  function handleHoldChoice(text: string): void {
    setDraft(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
      const pos = text.length;
      textareaRef.current.setSelectionRange(pos, pos);
    }
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    const value = event.target.value;
    const cursor = event.target.selectionStart ?? value.length;
    setDraft(value);
    mention.detectMention(value, cursor);
  }

  function selectMention(character: CharacterSummary): void {
    const nextDraft = mention.insertMention(character, draft, textareaRef);
    setDraft(nextDraft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    const handled = mention.handleKeyDown(event, filteredCast, selectMention);
    if (handled) return;

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
      {mention.mentionQuery !== null && cast.length > 0 ? (
        <MentionMenu
          characters={cast}
          query={mention.mentionQuery}
          selectedIndex={mention.mentionIndex}
          onSelect={selectMention}
        />
      ) : offering ? (
        <div
          className={showChoices ? "flex flex-col gap-2" : "hidden md:flex md:flex-col md:gap-2"}
        >
          <div className="flex items-center justify-end px-1">
            {onRerollChoices ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRerollChoices}
                disabled={busy || isRerollingChoices}
                aria-label="Reroll"
                className="h-6 gap-1.5 px-2 text-[0.6875rem] text-text-muted hover:text-text-secondary"
              >
                <HugeiconsIcon
                  icon={RefreshIcon}
                  size={12}
                  strokeWidth={2}
                  className={isRerollingChoices ? "animate-spin" : ""}
                />
                <span>Reroll</span>
              </Button>
            ) : null}
          </div>
          {isRerollingChoices
            ? [0, 1, 2].map((i) => <ChoiceSkeleton key={i} index={i} />)
            : choices
                .slice(0, 3)
                .map((choice, index) => (
                  <ChoiceRow
                    key={choice.label}
                    choice={choice}
                    index={index}
                    typing={typing}
                    onPress={() => choose(index as 0 | 1 | 2)}
                    onHold={() => handleHoldChoice(choice.label)}
                  />
                ))}
        </div>
      ) : null}

      <div className="flex flex-col rounded-card border-(length:--border-width-card) border-card-border bg-input-surface transition-colors focus-within:border-primary/60 motion-reduce:transition-none">
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={handleDraftChange}
          onKeyDown={onKeyDown}
          placeholder={
            offering
              ? "or type any action (type @ to mention a character)…"
              : "What do you do? (type @ to mention)"
          }
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
              onCompose={compose}
            />
            {offering ? (
              <Tooltip content={showChoices ? "Hide suggestions" : "Show suggestions"}>
                <Button
                  variant="outline"
                  size="iconSm"
                  disabled={busy}
                  onClick={() => setShowChoices((visible) => !visible)}
                  aria-label={showChoices ? "Hide suggestions" : "Show suggestions"}
                  className={
                    showChoices
                      ? "border-primary bg-primary/25 text-primary ring-1 ring-primary/40"
                      : "border-primary/30 bg-raised-hover text-text-accent hover:border-primary/60 hover:text-text-accent"
                  }
                >
                  <HugeiconsIcon icon={Idea01Icon} size={13} strokeWidth={1.75} />
                </Button>
              </Tooltip>
            ) : null}
            <WhisperCard
              whisper={whisper}
              composing={composingWhisper}
              disabled={busy}
              onChange={onWhisperChange}
              onCompose={onComposeWhisper}
            />
          </div>

          <div className="flex items-center gap-2">
            {busy ? (
              <Button
                variant="destructive"
                size="iconSm"
                onClick={onAbort}
                aria-label="Abort the current turn"
              >
                <HugeiconsIcon icon={StopIcon} size={14} strokeWidth={2} />
              </Button>
            ) : (
              <Button
                variant="default"
                size="iconSm"
                disabled={!ready}
                onClick={submit}
                aria-label="Submit your action"
              >
                <HugeiconsIcon
                  icon={ArrowUp02Icon}
                  size={15}
                  strokeWidth={2.25}
                  color={tokens.primaryForeground}
                />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
