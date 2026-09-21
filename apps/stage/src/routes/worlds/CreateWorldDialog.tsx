import type { ComposeMode, ComposeTarget } from "@chronicle/utils";
import { Globe02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { AppModal } from "~/components/common/AppModal";
import { useCompose } from "~/hooks/useCompose";
import type { WorldSummary } from "~/lib/entities";
import { StatDefinitionEditor } from "./StatDefinitionEditor";
import type { WorldDraft } from "./useWorldDraft";
import { useWorldDraft } from "./useWorldDraft";
import { WorldBasicsFields } from "./WorldBasicsFields";
import { WorldPremiseCard } from "./WorldPremiseCard";
import { WorldRules } from "./WorldRules";

const FIELD_OF: Record<string, keyof WorldDraft> = {
  "world.premise": "premise",
  "world.title": "title",
  "world.genre": "genre",
  "world.description": "description",
  "world.opening": "opening",
};

export interface CreateWorldDialogProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (world: WorldSummary) => void;
}

export function CreateWorldDialog({ visible, onClose, onCreated }: CreateWorldDialogProps) {
  const world = useWorldDraft();
  const compose = useCompose();
  const [abilityIndex, setAbilityIndex] = useState<number | null>(null);

  async function fill(target: ComposeTarget, mode: ComposeMode): Promise<void> {
    const key = FIELD_OF[target];
    if (key === undefined) return;
    const value = await compose.run(target, mode, world.composeContext);
    if (value !== null) world.update(key, value);
  }

  async function fillAbility(index: number, mode: ComposeMode): Promise<void> {
    const definition = world.draft.statDefinitions[index];
    if (definition === undefined) return;
    setAbilityIndex(index);
    const value = await compose.run("world.ability", mode, {
      ...world.composeContext,
      abilityLabel: definition.label,
      abilityDescription: definition.description,
    });
    setAbilityIndex(null);
    if (value === null) return;
    world.update(
      "statDefinitions",
      world.draft.statDefinitions.map((entry, position) =>
        position === index ? { ...entry, description: value } : entry,
      ),
    );
  }

  function dismiss(): void {
    world.reset();
    compose.clearError();
    onClose();
  }

  async function create(): Promise<void> {
    const created = await world.save();
    if (created === null) return;
    world.reset();
    onCreated(created);
  }

  const error = world.error ?? compose.error;

  return (
    <AppModal
      visible={visible}
      icon={Globe02Icon}
      title="Create a world"
      subtitle="Describe a premise, or write every field yourself"
      onClose={dismiss}
      actions={[
        { label: "Cancel", onPress: dismiss, tone: "secondary" },
        {
          label: world.saving ? "Creating…" : "Create world",
          onPress: () => void create(),
          tone: "primary",
          disabled: !world.complete || world.saving,
        },
      ]}
    >
      <WorldPremiseCard
        premise={world.draft.premise}
        drafting={world.drafting}
        busyMode={compose.modeFor("world.premise")}
        onChange={(value) => world.update("premise", value)}
        onCompose={(mode) => void fill("world.premise", mode)}
        onDraftAll={() => void world.assist()}
      />

      <WorldBasicsFields
        draft={world.draft}
        modeFor={compose.modeFor}
        onChange={(key, value) => world.update(key, value)}
        onShotSizeChange={(value) => world.update("shotSize", value)}
        onArtStyleChange={(value) => world.update("artStyle", value)}
        onCompose={(target, mode) => void fill(target, mode)}
      />

      <StatDefinitionEditor
        definitions={world.draft.statDefinitions}
        busyIndex={abilityIndex}
        busyMode={compose.modeFor("world.ability")}
        onChange={(definitions) => world.update("statDefinitions", definitions)}
        onCompose={(index, mode) => void fillAbility(index, mode)}
      />

      <WorldRules
        pointBudget={world.draft.pointBudget}
        visibility={world.draft.visibility}
        maximumSpend={world.maximumSpend}
        everythingAffordable={world.everythingAffordable}
        onBudgetChange={(budget) => world.update("pointBudget", budget)}
        onVisibilityChange={(visibility) => world.update("visibility", visibility)}
      />

      {error !== null ? (
        <p role="alert" className="text-[0.8125rem] text-danger">
          {error}
        </p>
      ) : null}
    </AppModal>
  );
}
