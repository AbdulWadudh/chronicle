import type { ComposeMode, ComposeTarget, Pronouns } from "@chronicle/utils";
import { UserGroupIcon, UserIcon, UserSharingIcon } from "@hugeicons/core-free-icons";
import { PointBuyStepper } from "~/components/character/PointBuyStepper";
import { ComposableField } from "~/components/common/ComposableField";
import { FormSection, LabeledRow, RowGroup } from "~/components/common/FormRow";
import { Segmented, type SegmentedOption } from "~/components/ui/segmented";
import type { Compose } from "~/hooks/useCompose";
import type { CharacterSummary, WorldDetail } from "~/lib/entities";
import { LookFields } from "./LookFields";
import { PersonaFields } from "./PersonaFields";
import { PortraitPanel } from "./PortraitPanel";
import type { useCharacterDraft } from "./useCharacterDraft";

const PRONOUNS: readonly SegmentedOption<Pronouns>[] = [
  { value: "she", label: "She", icon: UserIcon },
  { value: "he", label: "He", icon: UserSharingIcon },
  { value: "they", label: "They", icon: UserGroupIcon },
];

export interface CharacterFormProps {
  world: WorldDetail | null;
  existing: CharacterSummary | null;
  draft: ReturnType<typeof useCharacterDraft>;
  compose: Compose;
  onCompose: (target: ComposeTarget, mode: ComposeMode) => void;
}

export function CharacterForm({ world, existing, draft, compose, onCompose }: CharacterFormProps) {
  const error = draft.error ?? compose.error;

  return (
    <>
      <FormSection label="Identity">
        <ComposableField
          id="character-name"
          label="Name"
          actionNoun="name"
          value={draft.name}
          placeholder="Wren Alder"
          busyMode={compose.modeFor("character.name")}
          onChange={draft.setName}
          onCompose={(mode) => onCompose("character.name", mode)}
        />

        <RowGroup>
          <LabeledRow label="Pronouns" blurb="How the narrator refers to them.">
            <Segmented
              value={draft.pronouns}
              options={PRONOUNS}
              onValueChange={draft.setPronouns}
              ariaLabel="Character pronouns"
              className="w-auto shrink-0"
            />
          </LabeledRow>
        </RowGroup>
      </FormSection>

      <FormSection label="Look">
        <PortraitPanel
          key={existing?.id ?? "new-character"}
          existing={existing}
          worldId={world?.id ?? null}
          compose={compose}
          describe={() => ({
            name: draft.name,
            bio: draft.bio,
            strengths: draft.composeContext.strengths,
            pronouns: draft.pronouns,
          })}
          liveValues={() => ({
            name: draft.name.trim(),
            pronouns: draft.pronouns,
            bio: draft.bio.trim(),
            appearance: draft.appearance.trim(),
            outfit: draft.outfit.trim(),
          })}
        />

        <LookFields draft={draft} compose={compose} onCompose={onCompose} />
      </FormSection>

      {world !== null ? (
        <FormSection label="Abilities">
          <PointBuyStepper
            definitions={world.statDefinitionsJson}
            stats={draft.stats}
            budget={world.pointBudget}
            onChange={draft.setStats}
          />
        </FormSection>
      ) : null}

      <FormSection label="Backstory">
        <ComposableField
          id="character-bio"
          actionNoun="backstory"
          ariaLabel="Backstory"
          value={draft.bio}
          rows={8}
          placeholder="Who are they, and how did they end up here?"
          hint="The narrator reads this before every turn. Set the abilities first and the generated backstory will fit them."
          busyMode={compose.modeFor("character.bio")}
          onChange={draft.setBio}
          onCompose={(mode) => onCompose("character.bio", mode)}
        />
      </FormSection>

      <PersonaFields draft={draft} compose={compose} onCompose={onCompose} />

      {error !== null ? (
        <p role="alert" className="text-[0.8125rem] text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}
