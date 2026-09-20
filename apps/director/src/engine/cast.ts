import type { Pronouns, StatBlock, StatDefinition, World } from "@chronicle/utils";
import { baselineStats, canRaise, clampStatRank } from "@chronicle/utils";
import { type ChatMessage, completeStructured } from "~/engine/llm";

const CAST_SIZE = 3;
const CAST_TOKENS = 1600;
const CAST_TEMPERATURE = 1;
const EMPHASIS_CAPS = [5, 4];
const SPREAD_CAP = 2;
const LEFTOVER_CAP = 3;

const memberSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    pronouns: { type: "string", enum: ["he", "she", "they"] },
    bio: { type: "string" },
    emphasis: { type: "array", minItems: 1, maxItems: 2, items: { type: "string" } },
  },
  required: ["name", "pronouns", "bio", "emphasis"],
  additionalProperties: false,
} as const;

const CAST_SCHEMA = {
  type: "object",
  properties: {
    cast: { type: "array", minItems: CAST_SIZE, maxItems: CAST_SIZE, items: memberSchema },
  },
  required: ["cast"],
  additionalProperties: false,
} as const;

interface CastMember {
  name: string;
  pronouns: Pronouns;
  bio: string;
  emphasis: string[];
}

export interface DraftedCharacter {
  name: string;
  pronouns: Pronouns;
  bio: string;
  stats: StatBlock;
}

function castPrompt(world: World): ChatMessage[] {
  const abilities = world.statDefinitions
    .map((definition) => `${definition.id} (${definition.label}): ${definition.description}`)
    .join("\n");

  return [
    {
      role: "system",
      content: [
        `Cast ${CAST_SIZE} playable protagonists for an interactive story.`,
        "Make them sharply different from one another in background, motive and method.",
        "Each backstory is three or four sentences, third person, concrete and specific.",
        "emphasis lists one or two ability ids this character is best at, copied exactly.",
        "Vary the pronouns across the cast.",
        "Invent fresh names: no two share a surname, and avoid stock fantasy names.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Setting: ${world.title}. ${world.description}`,
        `Genre: ${world.genre}`,
        `Opening: ${world.initialState.summary}`,
        `Abilities:\n${abilities}`,
      ].join("\n"),
    },
  ];
}

function allocate(
  definitions: readonly StatDefinition[],
  budget: number,
  emphasis: readonly string[],
): StatBlock {
  const declared = new Set(definitions.map((definition) => definition.id));
  const wanted = emphasis.filter((id) => declared.has(id));
  const order = [...wanted, ...definitions.map((d) => d.id).filter((id) => !wanted.includes(id))];

  const stats = baselineStats(definitions);
  order.forEach((statId, position) => {
    const cap = EMPHASIS_CAPS[position] ?? SPREAD_CAP;
    while ((stats[statId] ?? 1) < cap && canRaise(stats, statId, budget)) {
      stats[statId] = clampStatRank((stats[statId] ?? 1) + 1);
    }
  });

  let spending = true;
  while (spending) {
    spending = false;
    for (const statId of order.slice(EMPHASIS_CAPS.length)) {
      if ((stats[statId] ?? 1) >= LEFTOVER_CAP) continue;
      if (!canRaise(stats, statId, budget)) continue;
      stats[statId] = clampStatRank((stats[statId] ?? 1) + 1);
      spending = true;
      break;
    }
  }
  return stats;
}

export async function draftCast(world: World): Promise<DraftedCharacter[]> {
  const drafted = await completeStructured<{ cast: CastMember[] }>(castPrompt(world), {
    schemaName: "world_cast",
    schema: CAST_SCHEMA,
    maxTokens: CAST_TOKENS,
    temperature: CAST_TEMPERATURE,
  });

  return drafted.cast
    .filter((member) => member.name.trim().length > 0)
    .map((member) => ({
      name: member.name.trim(),
      pronouns: member.pronouns,
      bio: member.bio.trim(),
      stats: allocate(world.statDefinitions, world.pointBudget, member.emphasis),
    }));
}
