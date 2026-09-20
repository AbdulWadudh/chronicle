import { z } from "zod";

export function audioChannel(turnId: string): string {
  return `stream:audio:${turnId}`;
}

export function imageChannel(turnId: string): string {
  return `stream:image:${turnId}`;
}

export function progressChannel(turnId: string): string {
  return `stream:progress:${turnId}`;
}

const imageParamsSchema = z.object({
  prompt: z.string().min(1),
  negativePrompt: z.string(),
  seed: z.number().int().nonnegative(),
  checkpoint: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  steps: z.number().int().positive(),
  cfg: z.number().positive(),
  sampler: z.string().min(1),
  scheduler: z.string().min(1),
  upscale: z.number().positive(),
  upscaleDenoise: z.number().positive(),
});

export const diffusionJobSchema = z.discriminatedUnion("kind", [
  imageParamsSchema.extend({
    kind: z.literal("scene"),
    worldId: z.string(),
    characterId: z.string(),
    turnId: z.string(),
    variant: z.number().int().positive(),
  }),
  imageParamsSchema.extend({ kind: z.literal("cover"), worldId: z.string() }),
  imageParamsSchema.extend({
    kind: z.literal("portrait"),
    worldId: z.string(),
    characterId: z.string(),
  }),
]);

export const ttsJobSchema = z.object({
  turnId: z.string(),
  worldId: z.string(),
  characterId: z.string(),
  sentenceIndex: z.number().int().nonnegative(),
  text: z.string().min(1),
  voice: z.string().min(1),
  speed: z.number().positive(),
});

export const memoryJobSchema = z.object({
  turnId: z.string(),
  characterId: z.string(),
  worldId: z.string(),
  narrativeText: z.string().min(1),
});

export const audioReadySchema = z.object({
  turnId: z.string(),
  sentenceIndex: z.number().int().nonnegative(),
  audioUrl: z.string(),
});

export const imageReadySchema = z.object({
  turnId: z.string(),
  imageUrl: z.string(),
});

export const imageProgressSchema = z.object({
  turnId: z.string(),
  value: z.number().int().nonnegative(),
  max: z.number().int().positive(),
});

export const assetReadySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("scene"), turnId: z.string(), imageUrl: z.string() }),
  z.object({ kind: z.literal("cover"), worldId: z.string(), imageUrl: z.string() }),
  z.object({ kind: z.literal("portrait"), characterId: z.string(), imageUrl: z.string() }),
]);

export type ImageParams = z.infer<typeof imageParamsSchema>;
export type DiffusionJob = z.infer<typeof diffusionJobSchema>;
export type DiffusionKind = DiffusionJob["kind"];
export type TtsJob = z.infer<typeof ttsJobSchema>;
export type MemoryJob = z.infer<typeof memoryJobSchema>;
export type AudioReady = z.infer<typeof audioReadySchema>;
export type ImageReady = z.infer<typeof imageReadySchema>;
export type ImageProgress = z.infer<typeof imageProgressSchema>;
export type AssetReady = z.infer<typeof assetReadySchema>;
