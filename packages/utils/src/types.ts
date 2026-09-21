import { RENDER_STYLES, type RenderStyleName } from "@chronicle/config";
import { z } from "zod";

export const statRankSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const statDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().default(""),
});

export const statBlockSchema = z.record(z.string(), statRankSchema);

export const inventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  quantity: z.number().int().nonnegative().default(1),
});

export const inventorySchema = z.array(inventoryItemSchema);

export const worldStateSchema = z.object({
  summary: z.string().default(""),
  facts: z.array(z.string()).default([]),
  affinities: z.record(z.string(), z.number()).default({}),
  flags: z.record(z.string(), z.boolean()).default({}),
});

export const worldVisibilitySchema = z.enum(["private", "public"]);

export const pronounsSchema = z.enum(["he", "she", "they"]);

const PRONOUN_PHRASE: Record<z.infer<typeof pronounsSchema>, string> = {
  he: "he/him",
  she: "she/her",
  they: "they/them",
};

export function pronounPhrase(pronouns: z.infer<typeof pronounsSchema>): string {
  return PRONOUN_PHRASE[pronouns];
}

export const shotSizeSchema = z.enum(["closeUp", "waistUp", "threeQuarter", "fullBody"]);

export const renderStyleSchema = z.enum(
  Object.keys(RENDER_STYLES) as [RenderStyleName, ...RenderStyleName[]],
);

export const worldSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  coverImageUrl: z.string().nullable(),
  genre: z.string().default(""),
  visualStyle: z.string().default(""),
  shotSize: shotSizeSchema.default("waistUp"),
  artStyle: renderStyleSchema.default("photoreal"),
  visibility: worldVisibilitySchema,
  statDefinitions: z.array(statDefinitionSchema),
  pointBudget: z.number().int().positive(),
  initialState: worldStateSchema,
  createdAt: z.coerce.date(),
});

export const characterSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  bio: z.string().default(""),
  appearance: z.string().default(""),
  outfit: z.string().default(""),
  outfitLocked: z.boolean().default(true),
  pronouns: pronounsSchema.default("they"),
  portraitUrl: z.string().nullable(),
  draftPortraitUrl: z.string().nullable().default(null),
  stats: statBlockSchema,
  inventory: inventorySchema,
  createdAt: z.coerce.date(),
});

export const statePatchSchema = z.object({
  summary: z.string().optional(),
  factsAdded: z.array(z.string()).optional(),
  affinityDeltas: z.record(z.string(), z.number()).optional(),
  flagsSet: z.record(z.string(), z.boolean()).optional(),
  statOverrides: statBlockSchema.optional(),
  inventoryAdded: inventorySchema.optional(),
  inventoryRemovedIds: z.array(z.string()).optional(),
});

export type StatRank = z.infer<typeof statRankSchema>;
export type StatDefinition = z.infer<typeof statDefinitionSchema>;
export type StatBlock = z.infer<typeof statBlockSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type Inventory = z.infer<typeof inventorySchema>;
export type WorldState = z.infer<typeof worldStateSchema>;
export type WorldVisibility = z.infer<typeof worldVisibilitySchema>;
export type Pronouns = z.infer<typeof pronounsSchema>;
export type World = z.infer<typeof worldSchema>;
export type Character = z.infer<typeof characterSchema>;
export type ShotSize = z.infer<typeof shotSizeSchema>;
export type RenderStyle = z.infer<typeof renderStyleSchema>;
export type StatePatch = z.infer<typeof statePatchSchema>;

export function applyStatePatch(state: WorldState, patch: StatePatch): WorldState {
  const affinities = { ...state.affinities };
  for (const [key, delta] of Object.entries(patch.affinityDeltas ?? {})) {
    affinities[key] = (affinities[key] ?? 0) + delta;
  }
  return {
    summary: patch.summary ?? state.summary,
    facts: [...state.facts, ...(patch.factsAdded ?? [])],
    affinities,
    flags: { ...state.flags, ...(patch.flagsSet ?? {}) },
  };
}
