import type { ComposeMode, ComposeTarget, RenderStyle, ShotSize } from "@chronicle/utils";
import { ComposableField } from "~/components/common/ComposableField";
import { WorldLookFields } from "~/components/world/WorldLookFields";
import type { WorldDraft } from "./useWorldDraft";

export interface WorldBasicsFieldsProps {
  draft: WorldDraft;
  modeFor: (target: ComposeTarget) => ComposeMode | null;
  onChange: (
    key: "title" | "genre" | "description" | "opening" | "visualStyle",
    value: string,
  ) => void;
  onShotSizeChange: (value: ShotSize) => void;
  onArtStyleChange: (value: RenderStyle) => void;
  onCompose: (target: ComposeTarget, mode: ComposeMode) => void;
}

export function WorldBasicsFields({
  draft,
  modeFor,
  onChange,
  onShotSizeChange,
  onArtStyleChange,
  onCompose,
}: WorldBasicsFieldsProps) {
  return (
    <>
      <ComposableField
        id="title"
        label="Title"
        actionNoun="title"
        value={draft.title}
        placeholder="The Tidewrought"
        busyMode={modeFor("world.title")}
        onChange={(value) => onChange("title", value)}
        onCompose={(mode) => onCompose("world.title", mode)}
      />

      <ComposableField
        id="genre"
        label="Genre"
        actionNoun="genre"
        value={draft.genre}
        placeholder="Gothic fantasy"
        busyMode={modeFor("world.genre")}
        onChange={(value) => onChange("genre", value)}
        onCompose={(mode) => onCompose("world.genre", mode)}
      />

      <ComposableField
        id="description"
        label="Description"
        actionNoun="description"
        value={draft.description}
        rows={3}
        placeholder="What kind of place is this, and what is wrong with it?"
        busyMode={modeFor("world.description")}
        onChange={(value) => onChange("description", value)}
        onCompose={(mode) => onCompose("world.description", mode)}
      />

      <ComposableField
        id="opening"
        label="Opening situation"
        actionNoun="opening situation"
        value={draft.opening}
        rows={3}
        placeholder="You wake on the cathedral steps with the tide at your ankles."
        hint="Where every character in this world begins. The narrator reads this first."
        busyMode={modeFor("world.opening")}
        onChange={(value) => onChange("opening", value)}
        onCompose={(mode) => onCompose("world.opening", mode)}
      />

      <WorldLookFields
        visualStyle={draft.visualStyle}
        shotSize={draft.shotSize}
        artStyle={draft.artStyle}
        busyMode={modeFor("world.visualStyle")}
        onVisualStyleChange={(value) => onChange("visualStyle", value)}
        onShotSizeChange={onShotSizeChange}
        onArtStyleChange={onArtStyleChange}
        onCompose={(mode) => onCompose("world.visualStyle", mode)}
      />
    </>
  );
}
