import { z } from "zod";
import { pronounsSchema } from "./types";

export const composeTargetSchema = z.enum([
  "world.premise",
  "world.title",
  "world.genre",
  "world.description",
  "world.opening",
  "world.ability",
  "world.visualStyle",
  "world.narratorPrompt",
  "world.cover",
  "character.name",
  "character.bio",
  "turn.action",
  "turn.scene",
  "turn.whisper",
  "character.portrait",
  "character.appearance",
  "character.outfit",
  "character.likes",
  "character.dislikes",
  "character.responseStyle",
]);

export const composeModeSchema = z.enum(["generate", "enhance"]);

export const composeContextSchema = z.object({
  premise: z.string().default(""),
  title: z.string().default(""),
  genre: z.string().default(""),
  description: z.string().default(""),
  opening: z.string().default(""),
  abilities: z.array(z.string()).default([]),
  abilityLabel: z.string().default(""),
  abilityDescription: z.string().default(""),
  visualStyle: z.string().default(""),
  narratorPrompt: z.string().default(""),
  coverPrompt: z.string().default(""),
  name: z.string().default(""),
  bio: z.string().default(""),
  strengths: z.string().default(""),
  action: z.string().default(""),
  situation: z.string().default(""),
  avoid: z.array(z.string()).default([]),
  portraitPrompt: z.string().default(""),
  appearance: z.string().default(""),
  outfit: z.string().default(""),
  likes: z.string().default(""),
  dislikes: z.string().default(""),
  responseStyle: z.string().default(""),
  scenePrompt: z.string().default(""),
  whisper: z.string().default(""),
  pronouns: pronounsSchema.default("they"),
});

export const composeRequestSchema = z.object({
  target: composeTargetSchema,
  mode: composeModeSchema,
  worldId: z.string().nullable().default(null),
  context: composeContextSchema,
});

export const composeResponseSchema = z.object({ value: z.string() });

export type ComposeTarget = z.infer<typeof composeTargetSchema>;
export type ComposeMode = z.infer<typeof composeModeSchema>;
export type ComposeContext = z.infer<typeof composeContextSchema>;
export type ComposeRequest = z.infer<typeof composeRequestSchema>;

type TextField = {
  [K in keyof ComposeContext]: ComposeContext[K] extends string ? K : never;
}[keyof ComposeContext];

export const COMPOSE_FIELD: Record<ComposeTarget, TextField> = {
  "world.premise": "premise",
  "world.title": "title",
  "world.genre": "genre",
  "world.description": "description",
  "world.opening": "opening",
  "world.ability": "abilityDescription",
  "world.visualStyle": "visualStyle",
  "world.narratorPrompt": "narratorPrompt",
  "world.cover": "coverPrompt",
  "character.name": "name",
  "character.bio": "bio",
  "turn.action": "action",
  "turn.scene": "scenePrompt",
  "turn.whisper": "whisper",
  "character.portrait": "portraitPrompt",
  "character.appearance": "appearance",
  "character.outfit": "outfit",
  "character.likes": "likes",
  "character.dislikes": "dislikes",
  "character.responseStyle": "responseStyle",
};
