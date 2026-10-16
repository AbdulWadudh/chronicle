import { z } from "zod";
import type { SettingBound } from "./settings";

const bound = (limits: SettingBound) => z.number().min(limits.min).max(limits.max);
const wholeBound = (limits: SettingBound) => bound(limits).int();

export const IMAGE_ENGINE_IDS = ["klein", "sdxl"] as const;
export type ImageEngineId = (typeof IMAGE_ENGINE_IDS)[number];

export const KLEIN_BOUNDS = {
  steps: { min: 1, max: 12, step: 1 },
  renderScale: { min: 1, max: 2, step: 0.25 },
} as const satisfies Record<string, SettingBound>;

export const SDXL_BOUNDS = {
  steps: { min: 1, max: 60, step: 1 },
  cfg: { min: 1, max: 20, step: 0.5 },
  upscale: { min: 1, max: 2, step: 0.25 },
  upscaleDenoise: { min: 0.1, max: 0.8, step: 0.05 },
  identityWeight: { min: 0, max: 1.5, step: 0.05 },
  identityCastWeight: { min: 0, max: 1, step: 0.05 },
  identityStart: { min: 0, max: 0.5, step: 0.01 },
  identityEnd: { min: 0.3, max: 1, step: 0.05 },
} as const satisfies Record<string, SettingBound>;

const CHECKPOINT_EXTENSIONS = [".safetensors", ".ckpt", ".sft"];

export const checkpointSchema = z
  .string()
  .min(1)
  .transform((value) => value.replaceAll("\\", "/").replace(/^\/+/u, ""))
  .refine((value) => !/^[a-zA-Z]:/u.test(value), "Checkpoint must be a relative path")
  .refine((value) => !value.split("/").includes(".."), "Checkpoint must not traverse upwards")
  .refine(
    (value) => CHECKPOINT_EXTENSIONS.some((extension) => value.toLowerCase().endsWith(extension)),
    `Checkpoint must end in ${CHECKPOINT_EXTENSIONS.join(", ")}`,
  );

export const kleinSettingsSchema = z.object({
  model: checkpointSchema.prefault("flux-2-klein-4b-fp8.safetensors"),
  textEncoder: checkpointSchema.prefault("qwen_3_4b.safetensors"),
  vae: checkpointSchema.prefault("flux2-vae.safetensors"),
  steps: wholeBound(KLEIN_BOUNDS.steps).default(4),
  renderScale: bound(KLEIN_BOUNDS.renderScale).default(1.5),
});

export const sdxlSettingsSchema = z.object({
  checkpoint: checkpointSchema.prefault("RealVisXL_V5.0_Lightning_fp16.safetensors"),
  stylisedCheckpoint: checkpointSchema.prefault("DreamShaperXL_Lightning.safetensors"),
  steps: wholeBound(SDXL_BOUNDS.steps).default(8),
  cfg: bound(SDXL_BOUNDS.cfg).default(2.5),
  sampler: z.string().min(1).default("dpmpp_sde"),
  scheduler: z.string().min(1).default("karras"),
  upscale: bound(SDXL_BOUNDS.upscale).default(1),
  upscaleDenoise: bound(SDXL_BOUNDS.upscaleDenoise).default(0.3),
  identityMethod: z.enum(["fidelity", "style", "neutral"]).default("style"),
  identityWeight: bound(SDXL_BOUNDS.identityWeight).default(0.65),
  identityCastWeight: bound(SDXL_BOUNDS.identityCastWeight).default(0.35),
  identityStart: bound(SDXL_BOUNDS.identityStart).default(0.15),
  identityEnd: bound(SDXL_BOUNDS.identityEnd).default(0.7),
  negativePrompt: z
    .string()
    .default(
      "text, watermark, signature, lowres, jpeg artifacts, blurry, out of focus, deformed hands, extra fingers, bad anatomy, mutated, disfigured face, oversaturated, flat lighting",
    ),
});

export type KleinSettings = z.infer<typeof kleinSettingsSchema>;
export type SdxlSettings = z.infer<typeof sdxlSettingsSchema>;

export interface ImageEngine {
  id: ImageEngineId;
  label: string;
  blurb: string;
  identity: "reference" | "pulid";
  prose: boolean;
  bounds: Record<string, SettingBound>;
}

export const IMAGE_ENGINES: Record<ImageEngineId, ImageEngine> = {
  klein: {
    id: "klein",
    label: "Flux.2 klein 4B",
    blurb: "Four steps, portraits as references, prose prompts.",
    identity: "reference",
    prose: true,
    bounds: KLEIN_BOUNDS,
  },
  sdxl: {
    id: "sdxl",
    label: "SDXL Lightning",
    blurb: "RealVis or DreamShaper with PuLID face lock, tag prompts.",
    identity: "pulid",
    prose: false,
    bounds: SDXL_BOUNDS,
  },
};
