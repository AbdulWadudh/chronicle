import type { ComposeMode, ComposeTarget } from "@chronicle/utils";
import { ComposableField } from "~/components/common/ComposableField";
import { LabeledRow, RowGroup } from "~/components/common/FormRow";
import { Switch } from "~/components/ui/switch";
import type { Compose } from "~/hooks/useCompose";
import type { useCharacterDraft } from "./useCharacterDraft";

export interface LookFieldsProps {
  draft: ReturnType<typeof useCharacterDraft>;
  compose: Compose;
  onCompose: (target: ComposeTarget, mode: ComposeMode) => void;
}

export function LookFields({ draft, compose, onCompose }: LookFieldsProps) {
  return (
    <>
      <ComposableField
        id="character-appearance"
        label="Appearance"
        actionNoun="appearance"
        value={draft.appearance}
        rows={3}
        placeholder="late thirties, lean and wiry, cropped black hair, burn scar across one forearm"
        hint="What a camera sees and the story never changes. Every scene reuses it, so the same person comes back each turn. Left empty, one is written from the backstory on the first render."
        busyMode={compose.modeFor("character.appearance")}
        onChange={draft.setAppearance}
        onCompose={(mode) => onCompose("character.appearance", mode)}
      />

      <RowGroup>
        <LabeledRow
          label="Keep the outfit"
          blurb={
            draft.outfitLocked
              ? "The same clothes in every scene."
              : "Each scene dresses them to fit the moment."
          }
        >
          <Switch
            checked={draft.outfitLocked}
            onCheckedChange={draft.setOutfitLocked}
            aria-label="Keep the same outfit across scenes"
          />
        </LabeledRow>
      </RowGroup>

      {draft.outfitLocked ? (
        <ComposableField
          id="character-outfit"
          label="Outfit"
          actionNoun="outfit"
          value={draft.outfit}
          rows={2}
          placeholder="oil-stained canvas coat, fingerless gloves, tool satchel slung at the hip"
          hint="Written once from the backstory if you leave it blank."
          busyMode={compose.modeFor("character.outfit")}
          onChange={draft.setOutfit}
          onCompose={(mode) => onCompose("character.outfit", mode)}
        />
      ) : null}
    </>
  );
}
