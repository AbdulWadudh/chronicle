import { z } from "zod";
import { ENSEMBLE_BOUNDS, ensembleSettingsSchema } from "./ensemble";
import { IMAGE_ENGINE_IDS, kleinSettingsSchema, sdxlSettingsSchema } from "./imageEngines";
import { MEMORY_BOUNDS, memorySettingsSchema } from "./memory";

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
    quality: { min: 50, max: 100, step: 1 },
  },
  tts: {
    speed: { min: 0.25, max: 4, step: 0.25 },
  },
  dice: {
    defaultDifficulty: { min: 5, max: 30, step: 1 },
  },
  ensemble: ENSEMBLE_BOUNDS,
  memory: MEMORY_BOUNDS,
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

const imageSchema = z.object({
  engine: z.enum(IMAGE_ENGINE_IDS).default("klein"),
  portraitEngine: z.enum(IMAGE_ENGINE_IDS).default("sdxl"),
  quality: wholeBound(SETTING_BOUNDS.image.quality).default(90),
  klein: kleinSettingsSchema.prefault({}),
  sdxl: sdxlSettingsSchema.prefault({}),
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
  memory: memorySettingsSchema.prefault({}),
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

const imagePatchSchema = z
  .object({
    engine: z.enum(IMAGE_ENGINE_IDS).optional(),
    portraitEngine: z.enum(IMAGE_ENGINE_IDS).optional(),
    quality: wholeBound(SETTING_BOUNDS.image.quality).optional(),
    klein: patchOf(kleinSettingsSchema),
    sdxl: patchOf(sdxlSettingsSchema),
  })
  .optional();

export const runtimeSettingsPatchSchema = z.object({
  narrative: patchOf(narrativeSchema),
  structured: patchOf(structuredSchema),
  prompt: patchOf(promptSchema),
  turn: patchOf(turnSchema),
  image: imagePatchSchema,
  tts: patchOf(ttsSchema),
  dice: patchOf(diceSchema),
  ensemble: patchOf(ensembleSettingsSchema),
  memory: patchOf(memorySettingsSchema),
});

export type RuntimeSettings = z.infer<typeof runtimeSettingsSchema>;
export type RuntimeSettingsPatch = z.infer<typeof runtimeSettingsPatchSchema>;
export type RuntimeSettingsGroup = keyof RuntimeSettings;

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = runtimeSettingsSchema.parse({});

export const RUNTIME_SETTING_GROUPS = Object.keys(
  DEFAULT_RUNTIME_SETTINGS,
) as RuntimeSettingsGroup[];
