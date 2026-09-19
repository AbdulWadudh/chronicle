import { z } from "zod";

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
  },
  turn: {
    bufferSize: { min: 1, max: 512, step: 8 },
  },
  image: {
    width: { min: 256, max: 2048, step: 64 },
    height: { min: 256, max: 2048, step: 64 },
    steps: { min: 1, max: 60, step: 1 },
    cfg: { min: 1, max: 20, step: 0.5 },
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
  historyDepth: wholeBound(SETTING_BOUNDS.prompt.historyDepth).default(8),
  recentFacts: wholeBound(SETTING_BOUNDS.prompt.recentFacts).default(6),
  sceneChars: wholeBound(SETTING_BOUNDS.prompt.sceneChars).default(320),
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
  "ddim",
  "uni_pc",
] as const;

export const SCHEDULERS = ["karras", "normal", "exponential", "sgm_uniform", "simple"] as const;

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
    values: { steps: 6, cfg: 2, sampler: "dpmpp_sde", scheduler: "karras" },
  },
  {
    id: "full",
    label: "Full SDXL model",
    summary: "Many steps, normal guidance. For standard SDXL checkpoints.",
    values: { steps: 26, cfg: 7, sampler: "dpmpp_2m", scheduler: "karras" },
  },
];

const imageSchema = z.object({
  checkpoint: checkpointSchema.prefault("DreamShaperXL_Lightning.safetensors"),
  width: wholeBound(SETTING_BOUNDS.image.width).default(1024),
  height: wholeBound(SETTING_BOUNDS.image.height).default(1024),
  steps: wholeBound(SETTING_BOUNDS.image.steps).default(6),
  cfg: bound(SETTING_BOUNDS.image.cfg).default(2),
  sampler: z.string().min(1).default("dpmpp_sde"),
  scheduler: z.string().min(1).default("karras"),
  negativePrompt: z.string().default("text, watermark, blurry"),
});

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
});

export const runtimeSettingsPatchSchema = z.object({
  narrative: narrativeSchema.partial().optional(),
  structured: structuredSchema.partial().optional(),
  prompt: promptSchema.partial().optional(),
  turn: turnSchema.partial().optional(),
  image: imageSchema.partial().optional(),
  tts: ttsSchema.partial().optional(),
  dice: diceSchema.partial().optional(),
});

export type RuntimeSettings = z.infer<typeof runtimeSettingsSchema>;
export type RuntimeSettingsPatch = z.infer<typeof runtimeSettingsPatchSchema>;
export type RuntimeSettingsGroup = keyof RuntimeSettings;

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = runtimeSettingsSchema.parse({});

export const RUNTIME_SETTING_GROUPS = Object.keys(
  DEFAULT_RUNTIME_SETTINGS,
) as RuntimeSettingsGroup[];

export function mergeRuntimeSettings(
  base: RuntimeSettings,
  patch: RuntimeSettingsPatch,
): RuntimeSettings {
  const merged: Record<string, unknown> = { ...base };
  for (const group of RUNTIME_SETTING_GROUPS) {
    const incoming = patch[group];
    if (incoming === undefined) continue;
    merged[group] = { ...base[group], ...incoming };
  }
  return runtimeSettingsSchema.parse(merged);
}
