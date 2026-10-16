import { PROSE, RENDER_STYLES, SUBJECT_BY_PRONOUN } from "@chronicle/config";
import type { Character, World } from "@chronicle/utils";
import type { CharacterLook } from "~/engine/appearance";
import { clip, describeLook, type ScenePromptRequest } from "~/engine/prompt/scene";

const EMPTY_LOOK: CharacterLook = { appearance: "", outfit: "" };

function sentence(...parts: readonly string[]): string {
  const text = parts.filter((part) => part.trim().length > 0).join(", ");
  return text.length === 0 ? "" : `${text.replace(/[.,\s]+$/u, "")}.`;
}

function subject(character: Character, look: CharacterLook, referenceIndex: number | null): string {
  const who = SUBJECT_BY_PRONOUN[character.pronouns];
  const described = describeLook(look);
  if (referenceIndex === null) return sentence(`${character.name} is ${who}`, described);
  return sentence(
    `The ${who.replace(/^an? /u, "")} in image ${referenceIndex + 1} is ${character.name}`,
    described,
  );
}

export function buildProseScenePrompt(
  request: ScenePromptRequest,
  referencedIds: readonly string[],
): string {
  const { world, character, interacting, looks } = request;
  const rendering = RENDER_STYLES[world.artStyle];
  const cast = [character, ...interacting];
  const people = cast.map((member) => {
    const index = referencedIds.indexOf(member.id);
    return subject(member, looks.get(member.id) ?? EMPTY_LOOK, index === -1 ? null : index);
  });
  const count =
    cast.length === 1 ? PROSE.scene.solo : PROSE.scene.pair(cast.map((member) => member.name));

  return [
    sentence(rendering.medium, PROSE.shot[world.shotSize]),
    sentence(`${world.genre} setting`, request.worldStyle),
    ...people,
    count,
    sentence(clip(request.visual, request.maxChars)),
    PROSE.scene.expression,
    PROSE.scene.anatomy,
    sentence(rendering.tail),
  ]
    .filter((part) => part.length > 0)
    .join(" ");
}

export function buildProsePortraitPrompt(
  world: World,
  character: Character,
  maxChars: number,
  look?: CharacterLook,
  worldStyle = "",
): string {
  const rendering = RENDER_STYLES[world.artStyle];
  const described =
    look !== undefined && look.appearance.length > 0
      ? describeLook(look)
      : clip(character.bio, maxChars);
  return [
    sentence(rendering.portraitMedium),
    sentence(`${world.genre} setting`, worldStyle),
    sentence(`${character.name} is ${SUBJECT_BY_PRONOUN[character.pronouns]}`, described),
    PROSE.portrait,
    sentence(rendering.tail),
  ]
    .filter((part) => part.length > 0)
    .join(" ");
}

export function buildProseCoverPrompt(world: World, maxChars: number, worldStyle = ""): string {
  const rendering = RENDER_STYLES[world.artStyle];
  return [
    sentence(`${rendering.medium} key art for ${world.title}`),
    sentence(`${world.genre} setting`, worldStyle),
    sentence(clip(world.description, maxChars)),
    PROSE.cover,
    sentence(rendering.tail),
  ]
    .filter((part) => part.length > 0)
    .join(" ");
}
