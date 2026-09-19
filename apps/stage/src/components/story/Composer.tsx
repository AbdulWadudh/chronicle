import type { TurnChoice } from "@chronicle/shared";
import { ArrowUp, type LucideIcon, Sparkles, Square, Wand2 } from "lucide-react";
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
    <div className="flex w-full max-w-[680px] flex-col gap-3 self-center border-t border-white/[0.06] bg-canvas/95 px-4 pt-3 pb-4">
      {choices.length > 0 && !busy ? (
        <div className="flex flex-col gap-2">
          {choices.slice(0, 3).map((choice, index) => (
            <button
              type="button"
              key={choice.label}
              onClick={() => onSelectChoice(index as 0 | 1 | 2)}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left"
            >
              <span className="text-[11px] font-semibold text-text-muted">{index + 1}</span>
              <span className="flex-1 text-[14px] leading-snug text-text-secondary">
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
          icon={Wand2}
          active={mode === "scratch"}
          onSelect={() => setMode("scratch")}
        />
        <ModeChip
          label="Enhance"
          icon={Sparkles}
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
          className={`flex-1 resize-none rounded-2xl border bg-input-surface px-5 py-3.5 text-[15px] leading-[22px] text-text-primary outline-none placeholder:text-text-muted ${
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
            <Square
              size={16}
              strokeWidth={1.5}
              color={tokens.textSecondary}
              fill={tokens.textSecondary}
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!ready}
            aria-label="Send action"
            className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
              ready ? "bg-primary" : "bg-white/[0.06]"
            }`}
          >
            <ArrowUp
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
  icon: LucideIcon;
  active: boolean;
  onSelect: () => void;
}

function ModeChip({ label, icon: Icon, active, onSelect }: ModeChipProps) {
  const tokens = useThemeTokens();
  return (
    <label
      className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 focus-within:outline focus-within:outline-2 focus-within:outline-primary ${
        active ? "bg-primary" : "border border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <input
        type="radio"
        name="action-mode"
        checked={active}
        onChange={onSelect}
        className="sr-only"
      />
      <Icon
        size={13}
        strokeWidth={1.5}
        color={active ? tokens.primaryForeground : tokens.textMuted}
      />
      <span
        className={`text-[12px] font-medium ${active ? "text-primary-foreground" : "text-text-muted"}`}
      >
        {label}
      </span>
    </label>
  );
}
