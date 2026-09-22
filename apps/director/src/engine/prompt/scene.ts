import {
  IMAGERY,
  RENDER_STYLES,
  SHOT_NEGATIVES,
  SHOT_SIZES,
  SUBJECT_BY_PRONOUN,
} from "@chronicle/config";
import type { Character, ImageShape, RenderStyle, ShotSize, World } from "@chronicle/utils";
import type { CharacterLook } from "~/engine/appearance";

export type LookIndex = ReadonlyMap<string, CharacterLook>;

const EMPTY_LOOK: CharacterLook = { appearance: "", outfit: "" };

interface Composition {
  framing: string;
  places: readonly [string, string];
}

const COMPOSITION: Record<ImageShape, Composition> = {
  landscape: {
    framing: "two-shot, both figures side by side",
    places: ["on the left", "on the right"],
  },
  portrait: {
    framing: "vertical two-shot, the two figures close together and overlapping",
    places: ["on the left, nearer the camera", "on the right, half a step behind"],
  },
  square: {
    framing: "two-shot, both figures in frame",
    places: ["on the left", "on the right"],
  },
};

export function describeLook(look: CharacterLook): string {
  return [look.appearance, look.outfit.length > 0 ? `wearing ${look.outfit}` : ""]
    .filter((part) => part.length > 0)
    .join(", ");
}

function subjectClause(character: Character, looks: LookIndex, placement: string): string {
  const parts = [
    `(${SUBJECT_BY_PRONOUN[character.pronouns]}:1.3)`,
    describeLook(looks.get(character.id) ?? EMPTY_LOOK),
    placement,
  ].filter((part) => part.length > 0);
  return `${character.name} (${parts.join(", ")})`;
}

export function buildSceneNegativePrompt(
  character: Character,
  interactingCharacters: readonly Character[] = [],
  shotSize: ShotSize = "waistUp",
  artStyle: RenderStyle = "photoreal",
): string {
  const { negativeSolo, negativeCast, negativeSameGender } = IMAGERY.scene;
  const negativeBase = `${IMAGERY.scene.negativeBase}, ${SHOT_NEGATIVES[shotSize]}, ${RENDER_STYLES[artStyle].negative}`;
  if (interactingCharacters.length === 0) return `${negativeBase}, ${negativeSolo}`;

  const genders = new Set([character.pronouns, ...interactingCharacters.map((c) => c.pronouns)]);
  const hasMale = genders.has("he");
  const hasFemale = genders.has("she");

  if (hasMale && hasFemale) return `${negativeBase}, ${negativeCast}, ${negativeSameGender}`;
  if (hasMale) return `${negativeBase}, ${negativeCast}, woman, female`;
  if (hasFemale) return `${negativeBase}, ${negativeCast}, man, male`;
  return `${negativeBase}, ${negativeCast}`;
}

export interface ScenePromptRequest {
  world: World;
  character: Character;
  visual: string;
  maxChars: number;
  interacting: readonly Character[];
  looks: LookIndex;
  shape: ImageShape;
  worldStyle: string;
}

export function buildScenePrompt(request: ScenePromptRequest): string {
  const { framing, expression } = IMAGERY.scene;
  const { world, character, interacting, looks } = request;
  const visual = clip(request.visual, request.maxChars);
  const shot = SHOT_SIZES[world.shotSize];
  const rendering = RENDER_STYLES[world.artStyle];
  const style = rendering.tail;
  const lead = `${shot.prefix} ${rendering.medium}`.trim();
  const setting = request.worldStyle.length > 0 ? `${request.worldStyle}, ` : "";

  if (interacting.length === 0) {
    const solo = subjectClause(character, looks, "");
    return `${lead}, ${shot.clause}, ${world.genre}, ${solo}, (${visual}:1.2), ${expression}, ${setting}${framing}, ${style}`;
  }

  const genders = new Set([character.pronouns, ...interacting.map((actor) => actor.pronouns)]);
  const pair =
    genders.has("he") && genders.has("she")
      ? "(one adult man and one adult woman:1.4)"
      : "(exactly two distinct people:1.3)";
  const composition = COMPOSITION[request.shape];
  const cast = [
    subjectClause(character, looks, composition.places[0]),
    ...interacting.map((actor) => subjectClause(actor, looks, composition.places[1])),
  ].join(" and ");

  return `${lead}, ${shot.clause}, ${world.genre}, ${pair}, ${composition.framing}, ${cast}, (${visual}:1.2), ${expression}, ${setting}${framing}, ${style}`;
}

export function buildCoverPrompt(world: World, maxChars: number, worldStyle = ""): string {
  const { lead, style } = IMAGERY.cover;
  const rendering = RENDER_STYLES[world.artStyle];
  const setting = worldStyle.length > 0 ? `${worldStyle}, ` : "";
  return `${rendering.medium} ${lead}, ${world.genre}, ${world.title}, ${clip(world.description, maxChars)}, ${setting}${style}, ${rendering.tail}`;
}

export function buildPortraitPrompt(
  world: World,
  character: Character,
  maxChars: number,
  look?: CharacterLook,
  worldStyle = "",
): string {
  const { chest, waist, style, belowChest } = IMAGERY.portrait;
  const rendering = RENDER_STYLES[world.artStyle];
  const lead = rendering.portraitMedium;
  const setting = worldStyle.length > 0 ? `${worldStyle}, ` : "";
  const described =
    look !== undefined && look.appearance.length > 0
      ? describeLook(look)
      : clip(character.bio, maxChars);
  const framing = belowChest.test(described) ? waist : chest;
  const who = SUBJECT_BY_PRONOUN[character.pronouns];
  return `${lead}, ${world.genre}, ${character.name}, ${who}, ${described}, ${framing}, ${setting}${style}, ${rendering.tail}`;
}

export function clip(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const window = text.slice(0, maxChars);
  const sentence = Math.max(
    window.lastIndexOf("."),
    window.lastIndexOf("!"),
    window.lastIndexOf("?"),
  );
  if (sentence > maxChars / 2) return window.slice(0, sentence + 1);
  const word = window.lastIndexOf(" ");
  return word > 0 ? window.slice(0, word) : window;
}
