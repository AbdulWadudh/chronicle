import { z } from "zod";

export const SETTINGS_CHANNEL = "settings:changed";
export const SETTINGS_ROW_ID = "runtime";

const narrativeSchema = z.object({
  temperature: z.number().min(0).max(2).default(0.9),
  maxTokens: z.number().int().positive().max(8192).default(900),
});

const structuredSchema = z.object({
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().int().positive().max(4096).default(400),
});

const promptSchema = z.object({
  historyDepth: z.number().int().min(1).max(40).default(8),
  recentFacts: z.number().int().min(1).max(40).default(6),
  sceneChars: z.number().int().min(64).max(2000).default(320),
});

const turnSchema = z.object({
  bufferSize: z.number().int().min(1).max(512).default(32),
});

const imageSchema = z.object({
  checkpoint: z.string().min(1).default("DreamShaperXL_Lightning.safetensors"),
  width: z.number().int().min(256).max(2048).default(1024),
  height: z.number().int().min(256).max(2048).default(1024),
  steps: z.number().int().min(1).max(60).default(6),
  cfg: z.number().min(1).max(20).default(2),
  sampler: z.string().min(1).default("dpmpp_sde"),
  scheduler: z.string().min(1).default("karras"),
  negativePrompt: z.string().default("text, watermark, blurry"),
});

const ttsSchema = z.object({
  voice: z.string().min(1).default("af_heart"),
  speed: z.number().min(0.25).max(4).default(1),
});

const diceSchema = z.object({
  defaultDifficulty: z.number().int().min(5).max(30).default(12),
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
