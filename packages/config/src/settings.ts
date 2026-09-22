import { z } from "zod";
import { ensembleSettingsSchema } from "./ensemble";

export const SETTINGS_CHANNEL = "settings:changed";
export const SETTINGS_ROW_ID = "runtime";

export interface SettingBound {
  min: number;
  max: number;
  step: number;
}

export const SETTING_BOUNDS = {
  narrative: {
    temperature: { min: 0, max: 2, step: 0.1 },
    maxTokens: { min: 64, max: 8192, step: 64 },
    thinkingBudget: { min: 0, max: 4096, step: 64 },
  },
  structured: {
    temperature: { min: 0, max: 2, step: 0.1 },
    maxTokens: { min: 64, max: 4096, step: 64 },
  },
  prompt: {
    historyDepth: { min: 1, max: 40, step: 1 },
    recentFacts: { min: 1, max: 40, step: 1 },
    sceneChars: { min: 64, max: 2000, step: 32 },
    sentences: { min: 1, max: 6, step: 1 },
  },
  turn: {
    bufferSize: { min: 1, max: 512, step: 8 },
  },
  image: {
    steps: { min: 1, max: 60, step: 1 },
    cfg: { min: 1, max: 20, step: 0.5 },
    upscale: { min: 1, max: 2, step: 0.25 },
    upscaleDenoise: { min: 0.1, max: 0.8, step: 0.05 },
    identityWeight: { min: 0, max: 1.5, step: 0.05 },
    identityCastWeight: { min: 0, max: 1, step: 0.05 },
    quality: { min: 50, max: 100, step: 1 },
    identityStart: { min: 0, max: 0.5, step: 0.01 },
    identityEnd: { min: 0.3, max: 1, step: 0.05 },
  },
  tts: {
    speed: { min: 0.25, max: 4, step: 0.25 },
  },
  dice: {
    defaultDifficulty: { min: 5, max: 30, step: 1 },
  },
} as const satisfies Record<string, Record<string, SettingBound>>;

const bound = (limits: SettingBound) => z.number().min(limits.min).max(limits.max);
const wholeBound = (limits: SettingBound) => bound(limits).int();

const narrativeSchema = z.object({
  temperature: bound(SETTING_BOUNDS.narrative.temperature).default(0.9),
  maxTokens: wholeBound(SETTING_BOUNDS.narrative.maxTokens).default(900),
  thinking: z.boolean().default(true),
  thinkingBudget: wholeBound(SETTING_BOUNDS.narrative.thinkingBudget).default(512),
});

const structuredSchema = z.object({
  temperature: bound(SETTING_BOUNDS.structured.temperature).default(0.2),
  maxTokens: wholeBound(SETTING_BOUNDS.structured.maxTokens).default(400),
});

const promptSchema = z.object({
  historyDepth: wholeBound(SETTING_BOUNDS.prompt.historyDepth).default(12),
  recentFacts: wholeBound(SETTING_BOUNDS.prompt.recentFacts).default(8),
  sceneChars: wholeBound(SETTING_BOUNDS.prompt.sceneChars).default(600),
  sentences: wholeBound(SETTING_BOUNDS.prompt.sentences).default(3),
});

const turnSchema = z.object({
  bufferSize: wholeBound(SETTING_BOUNDS.turn.bufferSize).default(32),
});

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

export const SAMPLERS = [
  "dpmpp_sde",
  "dpmpp_2m",
  "dpmpp_2m_sde",
  "dpmpp_3m_sde",
  "euler",
  "euler_ancestral",
  "heun",
  "lms",
  "ddim",
  "uni_pc",
] as const;

export const SCHEDULERS = [
  "karras",
  "exponential",
  "normal",
  "simple",
  "sgm_uniform",
  "beta",
  "turbo",
] as const;

export interface DiffusionPreset {
  id: string;
  label: string;
  summary: string;
  values: { steps: number; cfg: number; sampler: string; scheduler: string };
}

export const DIFFUSION_PRESETS: DiffusionPreset[] = [
  {
    id: "lightning",
    label: "Lightning model",
    summary: "Few steps, low guidance. For SDXL-Lightning and Turbo checkpoints.",
    values: { steps: 8, cfg: 2.5, sampler: "dpmpp_sde", scheduler: "karras" },
  },
  {
    id: "full",
    label: "Full SDXL model",
    summary: "Many steps, normal guidance. For standard SDXL checkpoints.",
    values: { steps: 26, cfg: 7, sampler: "dpmpp_2m", scheduler: "karras" },
  },
];

const imageSchema = z.object({
  checkpoint: checkpointSchema.prefault("RealVisXL_V5.0_Lightning_fp16.safetensors"),
  stylisedCheckpoint: checkpointSchema.prefault("DreamShaperXL_Lightning.safetensors"),
  steps: wholeBound(SETTING_BOUNDS.image.steps).default(8),
  cfg: bound(SETTING_BOUNDS.image.cfg).default(2.5),
  sampler: z.string().min(1).default("dpmpp_sde"),
  scheduler: z.string().min(1).default("karras"),
  quality: wholeBound(SETTING_BOUNDS.image.quality).default(90),
  upscale: bound(SETTING_BOUNDS.image.upscale).default(1),
  upscaleDenoise: bound(SETTING_BOUNDS.image.upscaleDenoise).default(0.3),
  identityMethod: z.enum(["fidelity", "style", "neutral"]).default("style"),
  identityWeight: bound(SETTING_BOUNDS.image.identityWeight).default(0.65),
  identityCastWeight: bound(SETTING_BOUNDS.image.identityCastWeight).default(0.35),
  identityStart: bound(SETTING_BOUNDS.image.identityStart).default(0.15),
  identityEnd: bound(SETTING_BOUNDS.image.identityEnd).default(0.7),
  negativePrompt: z
    .string()
    .default(
      "text, watermark, signature, lowres, jpeg artifacts, blurry, out of focus, deformed hands, extra fingers, bad anatomy, mutated, disfigured face, oversaturated, flat lighting",
    ),
});

export interface VoiceGroup {
  label: string;
  voices: readonly string[];
}

export const KOKORO_VOICES: VoiceGroup[] = [
  {
    label: "American female",
    voices: [
      "af_heart",
      "af_alloy",
      "af_aoede",
      "af_bella",
      "af_jessica",
      "af_kore",
      "af_nicole",
      "af_nova",
      "af_river",
      "af_sarah",
      "af_sky",
    ],
  },
  {
    label: "American male",
    voices: [
      "am_adam",
      "am_echo",
      "am_eric",
      "am_fenrir",
      "am_liam",
      "am_michael",
      "am_onyx",
      "am_puck",
      "am_santa",
    ],
  },
  { label: "British female", voices: ["bf_alice", "bf_emma", "bf_isabella", "bf_lily"] },
  { label: "British male", voices: ["bm_daniel", "bm_fable", "bm_george", "bm_lewis"] },
];

const ttsSchema = z.object({
  voice: z.string().min(1).default("af_heart"),
  speed: bound(SETTING_BOUNDS.tts.speed).default(1),
});

const diceSchema = z.object({
  defaultDifficulty: wholeBound(SETTING_BOUNDS.dice.defaultDifficulty).default(12),
});

export const runtimeSettingsSchema = z.object({
  narrative: narrativeSchema.prefault({}),
  structured: structuredSchema.prefault({}),
  prompt: promptSchema.prefault({}),
  turn: turnSchema.prefault({}),
  image: imageSchema.prefault({}),
  tts: ttsSchema.prefault({}),
  dice: diceSchema.prefault({}),
  ensemble: ensembleSettingsSchema.prefault({}),
});

function patchOf<T extends z.ZodRawShape>(group: z.ZodObject<T>) {
  const shape = Object.fromEntries(
    Object.entries(group.shape).map(([key, field]) => [
      key,
      z.optional(
        field instanceof z.ZodDefault || field instanceof z.ZodPrefault ? field.unwrap() : field,
      ),
    ]),
  ) as { [K in keyof T]: z.ZodOptional<T[K]> };
  return z.object(shape).optional();
}

export const runtimeSettingsPatchSchema = z.object({
  narrative: patchOf(narrativeSchema),
  structured: patchOf(structuredSchema),
  prompt: patchOf(promptSchema),
  turn: patchOf(turnSchema),
  image: patchOf(imageSchema),
  tts: patchOf(ttsSchema),
  dice: patchOf(diceSchema),
  ensemble: patchOf(ensembleSettingsSchema),
});

export type RuntimeSettings = z.infer<typeof runtimeSettingsSchema>;
export type RuntimeSettingsPatch = z.infer<typeof runtimeSettingsPatchSchema>;
export type RuntimeSettingsGroup = keyof RuntimeSettings;

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = runtimeSettingsSchema.parse({});

export const RUNTIME_SETTING_GROUPS = Object.keys(
  DEFAULT_RUNTIME_SETTINGS,
) as RuntimeSettingsGroup[];
