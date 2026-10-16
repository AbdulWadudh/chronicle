import { ENSEMBLE } from "@chronicle/config";
import { db, schema } from "@chronicle/db";
import { inventorySchema, pronounsSchema, statBlockSchema } from "@chronicle/utils";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const LOOK_MAX = 400;

const persona = z.string().max(ENSEMBLE.personalityMaxChars);

export const portraitSchema = z.object({
  prompt: z.string().min(1).max(600).optional(),
  name: z.string().min(1).optional(),
  pronouns: pronounsSchema.optional(),
  bio: z.string().optional(),
  appearance: z.string().max(LOOK_MAX).optional(),
  outfit: z.string().max(LOOK_MAX).optional(),
});

export const patchCharacterSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  appearance: z.string().max(LOOK_MAX).optional(),
  outfit: z.string().max(LOOK_MAX).optional(),
  outfitLocked: z.boolean().optional(),
  pronouns: pronounsSchema.optional(),
  likes: persona.optional(),
  dislikes: persona.optional(),
  responseStyle: persona.optional(),
  eagerness: z.number().int().min(0).max(100).optional(),
  voiceId: z.string().min(1).nullable().optional(),
  stats: statBlockSchema.optional(),
});

export const createCharacterSchema = z.object({
  worldId: z.string().min(1),
  name: z.string().min(1),
  bio: z.string().default(""),
  appearance: z.string().max(LOOK_MAX).default(""),
  outfit: z.string().max(LOOK_MAX).default(""),
  outfitLocked: z.boolean().default(true),
  pronouns: pronounsSchema.default("they"),
  portraitUrl: z.string().nullable().default(null),
  likes: persona.default(""),
  dislikes: persona.default(""),
  responseStyle: persona.default(""),
  eagerness: z.number().int().min(0).max(100).default(50),
  voiceId: z.string().min(1).nullable().default(null),
  stats: statBlockSchema,
  inventory: inventorySchema.default([]),
});

export async function readableWorld(worldId: string, userId: string) {
  const row = await db.select().from(schema.worlds).where(eq(schema.worlds.id, worldId)).get();
  if (row === undefined) return null;
  if (row.visibility === "private" && row.userId !== userId) return null;
  return row;
}

export async function ownedCharacter(id: string, userId: string) {
  const row = await db
    .select()
    .from(schema.characters)
    .where(and(eq(schema.characters.id, id), eq(schema.characters.userId, userId)))
    .get();
  return row ?? null;
}
