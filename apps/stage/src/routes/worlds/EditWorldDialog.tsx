import { API } from "@chronicle/config";
import type { ComposeMode, RenderStyle, ShotSize, WorldVisibility } from "@chronicle/utils";
import { Globe02Icon, LockIcon } from "@hugeicons/core-free-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppModal } from "~/components/common/AppModal";
import { ComposableField } from "~/components/common/ComposableField";
import { LabeledRow, RowGroup } from "~/components/common/FormRow";
import { Segmented, type SegmentedOption } from "~/components/ui/segmented";
import { WorldCoverPanel } from "~/components/world/WorldCoverPanel";
import { WorldLookFields } from "~/components/world/WorldLookFields";
import { useCompose } from "~/hooks/useCompose";
import { patch } from "~/lib/api";
import type { WorldSummary } from "~/lib/entities";
import { queryKeys } from "~/lib/queryKeys";

const VISIBILITY: readonly SegmentedOption<WorldVisibility>[] = [
  { value: "private", label: "Private", icon: LockIcon },
  { value: "public", label: "Public", icon: Globe02Icon },
];

export interface EditWorldDialogProps {
  world: WorldSummary | null;
  onClose: () => void;
  onSaved: (world: WorldSummary) => void;
}

export function EditWorldDialog({ world, onClose, onSaved }: EditWorldDialogProps) {
  const compose = useCompose();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [visualStyle, setVisualStyle] = useState("");
  const [shotSize, setShotSize] = useState<ShotSize>("waistUp");
  const [artStyle, setArtStyle] = useState<RenderStyle>("photoreal");
  const [visibility, setVisibility] = useState<WorldVisibility>("private");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (world === null) return;
    setTitle(world.title);
    setGenre(world.genre);
    setDescription(world.description);
    setVisualStyle(world.visualStyle);
    setShotSize(world.shotSize);
    setArtStyle(world.artStyle);
    setVisibility(world.visibility);
    setError(null);
  }, [world]);

  async function fill(
    target: "world.title" | "world.genre" | "world.description",
    mode: ComposeMode,
  ) {
    const value = await compose.run(target, mode, { title, genre, description }, world?.id ?? null);
    if (value === null) return;
    if (target === "world.title") setTitle(value);
    if (target === "world.genre") setGenre(value);
    if (target === "world.description") setDescription(value);
  }

  async function save(): Promise<void> {
    if (world === null) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await patch<WorldSummary>(`${API.worlds}/${world.id}`, {
        title: title.trim(),
        genre: genre.trim(),
        description: description.trim(),
        visualStyle: visualStyle.trim(),
        shotSize,
        artStyle,
        visibility,
      });
      void queryClient.invalidateQueries({ queryKey: ["worlds"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.world(world.id) });
      onSaved(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That world could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      visible={world !== null}
      icon={Globe02Icon}
      title="Edit world"
      subtitle="Its details, and the look every image in it is drawn from"
      onClose={onClose}
      actions={[
        { label: "Cancel", onPress: onClose, tone: "secondary" },
        {
          label: saving ? "Saving…" : "Save changes",
          onPress: () => void save(),
          tone: "primary",
          disabled: saving || title.trim().length === 0,
        },
      ]}
    >
      {world === null ? null : (
        <WorldCoverPanel
          worldId={world.id}
          title={title}
          genre={genre}
          description={description}
          coverImageUrl={world.coverImageUrl}
        />
      )}

      <ComposableField
        id="edit-world-title"
        label="Title"
        actionNoun="title"
        value={title}
        placeholder="The Tidewrought"
        busyMode={compose.modeFor("world.title")}
        onChange={setTitle}
        onCompose={(mode) => void fill("world.title", mode)}
      />

      <ComposableField
        id="edit-world-genre"
        label="Genre"
        actionNoun="genre"
        value={genre}
        placeholder="Gothic fantasy"
        busyMode={compose.modeFor("world.genre")}
        onChange={setGenre}
        onCompose={(mode) => void fill("world.genre", mode)}
      />

      <ComposableField
        id="edit-world-description"
        label="Description"
        actionNoun="description"
        value={description}
        rows={3}
        placeholder="What kind of place is this, and what is wrong with it?"
        busyMode={compose.modeFor("world.description")}
        onChange={setDescription}
        onCompose={(mode) => void fill("world.description", mode)}
      />

      <WorldLookFields
        visualStyle={visualStyle}
        shotSize={shotSize}
        artStyle={artStyle}
        busyMode={compose.modeFor("world.visualStyle")}
        onVisualStyleChange={setVisualStyle}
        onShotSizeChange={setShotSize}
        onArtStyleChange={setArtStyle}
        onCompose={(mode) => {
          void compose
            .run("world.visualStyle", mode, { visualStyle }, world?.id ?? null)
            .then((value) => {
              if (value !== null) setVisualStyle(value);
            });
        }}
      />

      <RowGroup label="Access">
        <LabeledRow label="Visibility" blurb="Public worlds appear in the community browser.">
          <Segmented
            value={visibility}
            options={VISIBILITY}
            onValueChange={setVisibility}
            ariaLabel="World visibility"
            className="w-auto shrink-0"
          />
        </LabeledRow>
      </RowGroup>

      {(error ?? compose.error) ? (
        <p role="alert" className="text-[0.8125rem] text-danger">
          {error ?? compose.error}
        </p>
      ) : null}
    </AppModal>
  );
}
