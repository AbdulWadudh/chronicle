import { db, schema } from "@chronicle/db";
import type { Character, World } from "@chronicle/utils";
import { eq } from "drizzle-orm";
import { completeStructured } from "~/engine/llm";

export interface CharacterLook {
  appearance: string;
  outfit: string;
}

const LOOK_TOKENS = 220;
export const LOOK_MAX_CHARS = 120;
export const LOOK_PART_MAX_CHARS = 26;

const APPEARANCE_PARTS = ["age", "build", "hair", "face"] as const;
const OUTFIT_PARTS = ["garments", "footwear", "carried"] as const;

const field = (description: string) => ({ type: "string", description });

const LOOK_SCHEMA = {
  type: "object",
  properties: {
    age: field("Apparent age alone, two or three words. Example: 'late thirties'."),
    build: field("Height and body build alone, three or four words. Example: 'tall and rawboned'."),
    hair: field("Hair colour, length and style alone. Say 'shaved head' if there is none."),
    face: field("Skin tone, facial hair and one distinguishing mark. No clothing."),
    garments: field("Upper and lower body clothing alone, with colours and materials."),
    footwear: field("Footwear alone. Say 'barefoot' if there is none."),
    carried: field("What is worn or carried on the body: belt, bag, armour, tools, jewellery."),
  },
  required: [...APPEARANCE_PARTS, ...OUTFIT_PARTS],
  additionalProperties: false,
} as const;

type LookParts = Record<(typeof APPEARANCE_PARTS)[number] | (typeof OUTFIT_PARTS)[number], string>;

function joinParts(parts: LookParts, keys: readonly (keyof LookParts)[]): string {
  return keys
    .map((key) => tidyLook(parts[key] ?? "", LOOK_PART_MAX_CHARS))
    .filter((part) => part.length > 0)
    .join(", ");
}

export function tidyLook(text: string, maxChars: number = LOOK_MAX_CHARS): string {
  const fragments = text
    .replace(/[.]/gu, ",")
    .split(",")
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 0);

  const kept: string[] = [];
  let length = 0;
  for (const fragment of fragments) {
    const cost = kept.length === 0 ? fragment.length : fragment.length + 2;
    if (length + cost > maxChars) break;
    kept.push(fragment);
    length += cost;
  }
  return kept.join(", ");
}

function looksComplete(character: Character): boolean {
  if (character.appearance.length === 0) return false;
  return !character.outfitLocked || character.outfit.length > 0;
}

async function draftLook(world: World, character: Character): Promise<CharacterLook> {
  const drafted = await completeStructured<LookParts>(
    [
      {
        role: "system",
        content:
          "You fill an illustrator's reference sheet for one character. Answer each field with that field only, in a short fragment: no sentences, no full stops, nothing about where they are or what they are doing.",
      },
      {
        role: "user",
        content: [
          `Setting: ${world.title}. ${world.description}`,
          `Genre: ${world.genre}`,
          `Character: ${character.name}, referred to as "${character.pronouns}".`,
          `Backstory: ${character.bio}`,
        ].join("\n\n"),
      },
    ],
    { schemaName: "character_look", schema: LOOK_SCHEMA, maxTokens: LOOK_TOKENS },
  );
  return {
    appearance: joinParts(drafted, APPEARANCE_PARTS),
    outfit: joinParts(drafted, OUTFIT_PARTS),
  };
}

function worn(character: Character, outfit: string): string {
  return character.outfitLocked ? outfit : "";
}

export async function ensureLook(world: World, character: Character): Promise<CharacterLook> {
  if (looksComplete(character)) {
    return { appearance: character.appearance, outfit: worn(character, character.outfit) };
  }

  let drafted: CharacterLook;
  try {
    drafted = await draftLook(world, character);
  } catch (cause) {
    console.error(`[director] could not draft a look for ${character.name}:`, cause);
    return { appearance: character.appearance, outfit: worn(character, character.outfit) };
  }

  const patch: Partial<CharacterLook> = {};
  if (character.appearance.length === 0) patch.appearance = drafted.appearance;
  if (character.outfitLocked && character.outfit.length === 0) patch.outfit = drafted.outfit;
  if (Object.keys(patch).length > 0) {
    await db.update(schema.characters).set(patch).where(eq(schema.characters.id, character.id));
  }

  return {
    appearance: patch.appearance ?? character.appearance,
    outfit: worn(character, patch.outfit ?? character.outfit),
  };
}

export async function ensureCastLooks(
  world: World,
  cast: readonly Character[],
): Promise<Map<string, CharacterLook>> {
  const looks = await Promise.all(cast.map((actor) => ensureLook(world, actor)));
  return new Map(
    cast.map((actor, index) => [actor.id, looks[index] ?? { appearance: "", outfit: "" }]),
  );
}
