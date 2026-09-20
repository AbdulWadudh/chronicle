import type { ComposeMode, ComposeTarget } from "@chronicle/utils";
import { UserAdd01Icon, UserEdit01Icon } from "@hugeicons/core-free-icons";
import { AppModal } from "~/components/common/AppModal";
import { useCompose } from "~/hooks/useCompose";
import type { CharacterSummary, WorldDetail } from "~/lib/entities";
import { CharacterForm } from "./CharacterForm";
import { useCharacterDraft } from "./useCharacterDraft";

export interface CharacterDialogProps {
  visible: boolean;
  world: WorldDetail | null;
  existing?: CharacterSummary | null;
  onClose: () => void;
  onSaved: (character: CharacterSummary) => void;
}

export function CharacterDialog({
  visible,
  world,
  existing = null,
  onClose,
  onSaved,
}: CharacterDialogProps) {
  const draft = useCharacterDraft(world, existing);
  const compose = useCompose();
  const editing = existing !== null;

  async function fill(target: ComposeTarget, mode: ComposeMode): Promise<void> {
    if (world === null) return;
    const value = await compose.run(target, mode, draft.composeContext, world.id);
    if (value === null) return;
    if (target === "character.name") draft.setName(value);
    else draft.setBio(value);
  }

  function dismiss(): void {
    draft.reset();
    compose.clearError();
    onClose();
  }

  async function submit(): Promise<void> {
    const saved = await draft.save();
    if (saved === null) return;
    onSaved(saved);
  }

  const action = editing ? "Save changes" : "Begin the story";

  return (
    <AppModal
      visible={visible}
      icon={editing ? UserEdit01Icon : UserAdd01Icon}
      title={editing ? `Edit ${existing.name}` : "Create a character"}
      subtitle={world === null ? undefined : `Your protagonist in ${world.title}`}
      onClose={dismiss}
      actions={[
        { label: "Cancel", onPress: dismiss, tone: "secondary" },
        {
          label: draft.saving ? "Saving…" : action,
          onPress: () => void submit(),
          tone: "primary",
          disabled: !draft.complete,
          busy: draft.saving,
        },
      ]}
    >
      <CharacterForm
        world={world}
        existing={existing}
        draft={draft}
        compose={compose}
        onCompose={fill}
      />
    </AppModal>
  );
}
