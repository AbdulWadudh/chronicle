import type { TurnChoice } from "@chronicle/shared";
import { ArrowUp02Icon, MagicWand01Icon, SparklesIcon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { type KeyboardEvent, useState } from "react";
import { useThemeTokens } from "~/theme/ThemeEngine";

export type ActionMode = "scratch" | "enhanced";

const DRAFT_STYLE = { fieldSizing: "content", minHeight: 56, maxHeight: 128 } as const;

export interface ComposerProps {
  choices: readonly TurnChoice[];
  busy: boolean;
  onSelectChoice: (choiceIndex: 0 | 1 | 2) => void;
  onSubmitAction: (action: string, mode: ActionMode) => void;
  onAbort: () => void;
}

export function Composer({
  choices,
  busy,
  onSelectChoice,
  onSubmitAction,
  onAbort,
}: ComposerProps) {
  const tokens = useThemeTokens();
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<ActionMode>("scratch");
  const [focused, setFocused] = useState(false);
  const ready = draft.trim().length > 0 && !busy;

  function submit(): void {
    if (!ready) return;
    onSubmitAction(draft.trim(), mode);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    submit();
  }

  return (
    <div className="flex w-full max-w-[680px] flex-col gap-3 self-center border-t border-hairline bg-canvas/95 px-4 pt-3 pb-4">
      {choices.length > 0 && !busy ? (
        <div className="flex flex-col gap-2">
          {choices.slice(0, 3).map((choice, index) => (
            <button
              type="button"
              key={choice.label}
              onClick={() => onSelectChoice(index as 0 | 1 | 2)}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border-[length:var(--border-width-card)] border-hairline bg-raised px-4 py-3 text-left"
            >
              <span className="text-[0.6875rem] font-semibold text-text-muted">{index + 1}</span>
              <span className="flex-1 text-[0.875rem] leading-snug text-text-secondary">
                {choice.label}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <fieldset className="flex items-center gap-1.5 border-0 p-0">
        <legend className="sr-only">Action mode</legend>
        <ModeChip
          label="Scratch"
          icon={MagicWand01Icon}
          active={mode === "scratch"}
          onSelect={() => setMode("scratch")}
        />
        <ModeChip
          label="Enhance"
          icon={SparklesIcon}
          active={mode === "enhanced"}
          onSelect={() => setMode("enhanced")}
        />
      </fieldset>

      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="What do you do?"
          rows={1}
          disabled={busy}
          aria-label="Your action"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={DRAFT_STYLE}
          className={`flex-1 resize-none rounded-[var(--radius-card)] border bg-input-surface px-5 py-3.5 text-[0.9375rem] leading-[22px] text-text-primary outline-none placeholder:text-text-muted ${
            focused ? "border-primary" : "border-card-border"
          }`}
        />
        {busy ? (
          <button
            type="button"
            onClick={onAbort}
            aria-label="Stop generating"
            className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-secondary"
          >
            <HugeiconsIcon icon={StopIcon} size={18} strokeWidth={2} color={tokens.textSecondary} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!ready}
            aria-label="Send action"
            className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
              ready ? "bg-primary" : "bg-sunken"
            }`}
          >
            <HugeiconsIcon
              icon={ArrowUp02Icon}
              size={20}
              strokeWidth={2}
              color={ready ? tokens.primaryForeground : tokens.textMuted}
            />
          </button>
        )}
      </div>
    </div>
  );
}

interface ModeChipProps {
  label: string;
  icon: IconSvgElement;
  active: boolean;
  onSelect: () => void;
}

function ModeChip({ label, icon, active, onSelect }: ModeChipProps) {
  const tokens = useThemeTokens();
  return (
    <label
      className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 focus-within:outline focus-within:outline-2 focus-within:outline-primary ${
        active ? "bg-primary" : "border-[length:var(--border-width-card)] border-hairline bg-raised"
      }`}
    >
      <input
        type="radio"
        name="action-mode"
        checked={active}
        onChange={onSelect}
        className="sr-only"
      />
      <HugeiconsIcon
        icon={icon}
        size={13}
        strokeWidth={1.5}
        color={active ? tokens.primaryForeground : tokens.textMuted}
      />
      <span
        className={`text-[0.75rem] font-medium ${active ? "text-primary-foreground" : "text-text-muted"}`}
      >
        {label}
      </span>
    </label>
  );
}
