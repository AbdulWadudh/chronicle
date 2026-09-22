import type { ComposeMode } from "@chronicle/utils";
import { ComposableField } from "~/components/common/ComposableField";
import { FormSection, LabeledRow, RowGroup } from "~/components/common/FormRow";
import { VoiceSelect } from "~/components/common/VoiceSelect";
import { Switch } from "~/components/ui/switch";

export interface WorldNarrationFieldsProps {
  narratorPrompt: string;
  narratorVoiceId: string | null;
  ensembleEnabled: boolean;
  busyMode: ComposeMode | null;
  onNarratorPromptChange: (value: string) => void;
  onNarratorVoiceChange: (value: string | null) => void;
  onEnsembleChange: (value: boolean) => void;
  onCompose: (mode: ComposeMode) => void;
}

export function WorldNarrationFields({
  narratorPrompt,
  narratorVoiceId,
  ensembleEnabled,
  busyMode,
  onNarratorPromptChange,
  onNarratorVoiceChange,
  onEnsembleChange,
  onCompose,
}: WorldNarrationFieldsProps) {
  return (
    <FormSection label="Narration">
      <ComposableField
        id="world-narrator-prompt"
        label="Narrator instruction"
        actionNoun="instruction"
        value={narratorPrompt}
        rows={3}
        placeholder="Keep it dry and understated. Never explain a feeling the player can infer."
        hint="Prepended to every narration request for this world. Use it for voice and register, not for plot — the story comes from play."
        busyMode={busyMode}
        onChange={onNarratorPromptChange}
        onCompose={onCompose}
      />

      <RowGroup>
        <VoiceSelect
          value={narratorVoiceId}
          label="Narrating voice"
          blurb="Reads every sentence aloud in Cinema Mode."
          ariaLabel="Narrating voice"
          onValueChange={onNarratorVoiceChange}
        />
        <LabeledRow
          label="Group scenes"
          blurb="Lets the whole cast present in a scene speak and act on their own, instead of only when you name them."
        >
          <Switch
            checked={ensembleEnabled}
            onCheckedChange={onEnsembleChange}
            aria-label="Group scenes"
          />
        </LabeledRow>
      </RowGroup>
    </FormSection>
  );
}
