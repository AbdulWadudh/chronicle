import type { ComposeMode, ComposeTarget, Pronouns } from "@chronicle/utils";
import { UserGroupIcon, UserIcon, UserSharingIcon } from "@hugeicons/core-free-icons";
import { PointBuyStepper } from "~/components/character/PointBuyStepper";
import { ComposableField } from "~/components/common/ComposableField";
import { GroupLabel } from "~/components/ui/label";
import { Segmented, type SegmentedOption } from "~/components/ui/segmented";
import type { Compose } from "~/hooks/useCompose";
import type { CharacterSummary, WorldDetail } from "~/lib/entities";
import { LookFields } from "./LookFields";
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

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <GroupLabel>Pronouns</GroupLabel>
          <p className="text-[0.6875rem] leading-relaxed text-text-muted">
            How the narrator refers to them, every turn.
          </p>
        </div>
        <Segmented
          value={draft.pronouns}
          options={PRONOUNS}
          onValueChange={draft.setPronouns}
          ariaLabel="Character pronouns"
          className="w-auto shrink-0"
        />
      </div>

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
      />

      <LookFields draft={draft} compose={compose} onCompose={onCompose} />

      {world !== null ? (
        <PointBuyStepper
          definitions={world.statDefinitionsJson}
          stats={draft.stats}
          budget={world.pointBudget}
          onChange={draft.setStats}
        />
      ) : null}

      <ComposableField
        id="character-bio"
        label="Backstory"
        actionNoun="backstory"
        value={draft.bio}
        rows={8}
        placeholder="Who are they, and how did they end up here?"
        hint="The narrator reads this before every turn. Set the abilities first and the generated backstory will fit them."
        busyMode={compose.modeFor("character.bio")}
        onChange={draft.setBio}
        onCompose={(mode) => onCompose("character.bio", mode)}
      />

      {error !== null ? (
        <p role="alert" className="text-[0.8125rem] text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}
