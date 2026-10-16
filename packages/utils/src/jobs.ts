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

const renderBaseSchema = z.object({
  prompt: z.string().min(1),
  seed: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  quality: z.number().int().min(1).max(100).default(90),
  portraitUrls: z.array(z.string()).default([]),
});

export const renderParamsSchema = z.discriminatedUnion("engine", [
  renderBaseSchema.extend({
    engine: z.literal("klein"),
    model: z.string().min(1),
    textEncoder: z.string().min(1),
    vae: z.string().min(1),
    steps: z.number().int().positive(),
  }),
  renderBaseSchema.extend({
    engine: z.literal("sdxl"),
    negativePrompt: z.string(),
    checkpoint: z.string().min(1),
    steps: z.number().int().positive(),
    cfg: z.number().positive(),
    sampler: z.string().min(1),
    scheduler: z.string().min(1),
    upscale: z.number().positive(),
    upscaleDenoise: z.number().positive(),
    identity: z.object({
      method: z.enum(["fidelity", "style", "neutral"]),
      weight: z.number(),
      castWeight: z.number(),
      startAt: z.number(),
      endAt: z.number(),
    }),
  }),
]);

const imageParamsSchema = z.object({ render: renderParamsSchema });

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
    draft: z.boolean().default(false),
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
  speakerId: z.string().nullable().default(null),
});

export const memoryJobSchema = z.object({
  turnId: z.string(),
  characterId: z.string(),
  worldId: z.string(),
  playerAction: z.string(),
  narrativeText: z.string().min(1),
  summarise: z
    .object({ previous: z.string(), earlierTurns: z.array(z.string()) })
    .nullable()
    .default(null),
});

export const memoryReadySchema = z.object({
  turnId: z.string(),
  summary: z.string(),
  factsAdded: z.array(z.string()),
});

export const audioReadySchema = z.object({
  turnId: z.string(),
  sentenceIndex: z.number().int().nonnegative(),
  audioUrl: z.string(),
  speakerId: z.string().nullable().default(null),
});

export const imageReadySchema = z.object({
  turnId: z.string(),
  imageUrl: z.string(),
});

export const imageStageSchema = z.enum(["sketch", "detail"]);

export const imageProgressSchema = z.object({
  turnId: z.string(),
  value: z.number().int().nonnegative(),
  max: z.number().int().positive(),
  stage: imageStageSchema,
  preview: z.string().nullable().default(null),
});

export const assetReadySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("scene"), turnId: z.string(), imageUrl: z.string() }),
  z.object({ kind: z.literal("cover"), worldId: z.string(), imageUrl: z.string() }),
  z.object({
    kind: z.literal("portrait"),
    characterId: z.string(),
    imageUrl: z.string(),
    draft: z.boolean().default(false),
  }),
]);

export type RenderParams = z.infer<typeof renderParamsSchema>;
export type KleinRender = Extract<RenderParams, { engine: "klein" }>;
export type SdxlRender = Extract<RenderParams, { engine: "sdxl" }>;
export type DiffusionJob = z.infer<typeof diffusionJobSchema>;
export type DiffusionKind = DiffusionJob["kind"];
export type TtsJob = z.infer<typeof ttsJobSchema>;
export type MemoryJob = z.infer<typeof memoryJobSchema>;
export type MemoryReady = z.infer<typeof memoryReadySchema>;
export type AudioReady = z.infer<typeof audioReadySchema>;
export type ImageReady = z.infer<typeof imageReadySchema>;
export type ImageStage = z.infer<typeof imageStageSchema>;
export type ImageProgress = z.infer<typeof imageProgressSchema>;
export type AssetReady = z.infer<typeof assetReadySchema>;
