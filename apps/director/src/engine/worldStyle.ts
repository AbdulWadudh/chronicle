import { db, schema } from "@chronicle/db";
import type { World } from "@chronicle/utils";
import { eq } from "drizzle-orm";
import { tidyLook } from "~/engine/appearance";
import { completeStructured } from "~/engine/llm";

const STYLE_TOKENS = 260;
const STYLE_PART_MAX_CHARS = 40;

const STYLE_PARTS = ["era", "architecture", "materials", "palette", "light", "weather"] as const;

type StyleParts = Record<(typeof STYLE_PARTS)[number], string>;

const field = (description: string) => ({ type: "string", description });

const STYLE_SCHEMA = {
  type: "object",
  properties: {
    era: field(
      "The technological age this world reads as. Example: 'late industrial, early electric'.",
    ),
    architecture: field("What the buildings and streets look like. No people, no story."),
    materials: field("The surfaces and textures that recur: concrete, rusted iron, wet brick."),
    palette: field("Three or four colours that dominate every frame."),
    light: field("The characteristic light: sodium glare, overcast grey, red emergency wash."),
    weather: field("The usual air and weather: smog, drizzle, ash, dry heat."),
  },
  required: [...STYLE_PARTS],
  additionalProperties: false,
} as const;

async function draftStyle(world: World): Promise<string> {
  const drafted = await completeStructured<StyleParts>(
    [
      {
        role: "system",
        content:
          "You write the art direction for an illustrated story, so that every scene drawn in this world looks like the same place. Answer each field with that field only, in a short fragment: no sentences, no full stops, no characters and no events.",
      },
      {
        role: "user",
        content: [
          `Title: ${world.title}`,
          `Genre: ${world.genre}`,
          `Description: ${world.description}`,
        ].join("\n\n"),
      },
    ],
    { schemaName: "world_style", schema: STYLE_SCHEMA, maxTokens: STYLE_TOKENS },
  );

  return STYLE_PARTS.map((part) => tidyLook(drafted[part] ?? "", STYLE_PART_MAX_CHARS))
    .filter((part) => part.length > 0)
    .join(", ");
}

export async function ensureWorldStyle(world: World): Promise<string> {
  if (world.visualStyle.length > 0) return world.visualStyle;

  let visualStyle: string;
  try {
    visualStyle = await draftStyle(world);
  } catch (cause) {
    console.error(`[director] could not draft an art direction for ${world.title}:`, cause);
    return "";
  }
  if (visualStyle.length === 0) return "";

  await db.update(schema.worlds).set({ visualStyle }).where(eq(schema.worlds.id, world.id));
  return visualStyle;
}
