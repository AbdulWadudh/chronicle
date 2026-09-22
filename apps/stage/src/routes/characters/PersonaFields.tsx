import type { ComposeMode, ComposeTarget } from "@chronicle/utils";
import { ComposableField } from "~/components/common/ComposableField";
import { FormSection, RowGroup } from "~/components/common/FormRow";
import { VoiceSelect } from "~/components/common/VoiceSelect";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import type { Compose } from "~/hooks/useCompose";
import type { useCharacterDraft } from "./useCharacterDraft";

const EAGERNESS_STEP = 5;

function eagernessBlurb(value: number): string {
  if (value === 0) return "Never speaks unless you name them directly.";
  if (value <= 25) return "Hangs back. Speaks when it matters to them.";
  if (value <= 60) return "Joins in about as often as anyone else.";
  if (value <= 85) return "Quick to weigh in, even uninvited.";
  return "Interrupts. Hard to keep out of a conversation.";
}

export interface PersonaFieldsProps {
  draft: ReturnType<typeof useCharacterDraft>;
  compose: Compose;
  onCompose: (target: ComposeTarget, mode: ComposeMode) => void;
}

export function PersonaFields({ draft, compose, onCompose }: PersonaFieldsProps) {
  return (
    <FormSection label="Personality">
      <ComposableField
        id="character-likes"
        label="Warms to"
        actionNoun="likes"
        value={draft.likes}
        rows={2}
        placeholder="Plain speech, people who admit when they are lost, cold weather"
        hint="What earns their patience. The narrator uses it to decide when they soften."
        busyMode={compose.modeFor("character.likes")}
        onChange={draft.setLikes}
        onCompose={(mode) => onCompose("character.likes", mode)}
      />

      <ComposableField
        id="character-dislikes"
        label="Bristles at"
        actionNoun="dislikes"
        value={draft.dislikes}
        rows={2}
        placeholder="Being managed, oaths sworn lightly, anyone who mentions the harbour"
        hint="What sets them off. Reach for something specific — a whole subject, not a mood."
        busyMode={compose.modeFor("character.dislikes")}
        onChange={draft.setDislikes}
        onCompose={(mode) => onCompose("character.dislikes", mode)}
      />

      <ComposableField
        id="character-response-style"
        label="Manner of speech"
        actionNoun="manner"
        value={draft.responseStyle}
        rows={2}
        placeholder="Clipped and dry. Answers a question with a question when cornered."
        hint="How they talk, not what they think. This is what keeps two characters sounding different."
        busyMode={compose.modeFor("character.responseStyle")}
        onChange={draft.setResponseStyle}
        onCompose={(mode) => onCompose("character.responseStyle", mode)}
      />

      <RowGroup>
        <VoiceSelect
          value={draft.voiceId}
          label="Speaking voice"
          blurb="Reads this character's dialogue aloud. Falls back to the world's narrator."
          ariaLabel="Character speaking voice"
          allowInherit
          onValueChange={draft.setVoiceId}
        />
      </RowGroup>

      <div className="flex flex-col gap-1.5 rounded-card border-(length:--border-width-card) border-card-border bg-raised px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="character-eagerness">Eagerness to speak</Label>
          <span className="text-[0.6875rem] tabular-nums text-text-muted">{draft.eagerness}</span>
        </div>
        <Slider
          id="character-eagerness"
          value={draft.eagerness}
          min={0}
          max={100}
          step={EAGERNESS_STEP}
          onValueChange={(value) =>
            draft.setEagerness(typeof value === "number" ? value : (value[0] ?? draft.eagerness))
          }
        />
        <p className="text-[0.75rem] leading-relaxed text-text-muted">
          {eagernessBlurb(draft.eagerness)} Only applies in worlds with group scenes turned on.
        </p>
      </div>
    </FormSection>
  );
}
