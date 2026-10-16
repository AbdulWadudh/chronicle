import type {
  RuntimeSettings,
  RuntimeSettingsGroup,
  RuntimeSettingsPatch,
} from "@chronicle/config";
import { RUNTIME_SETTING_GROUPS, runtimeSettingsSchema } from "@chronicle/config";

function isPlain(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeGroup(base: unknown, incoming: unknown): unknown {
  if (!isPlain(base) || !isPlain(incoming)) return incoming;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue;
    out[key] = isPlain(value) && isPlain(base[key]) ? mergeGroup(base[key], value) : value;
  }
  return out;
}

export function mergeRuntimeSettings(
  base: RuntimeSettings,
  patch: RuntimeSettingsPatch,
): RuntimeSettings {
  const merged: Record<string, unknown> = { ...base };
  for (const group of RUNTIME_SETTING_GROUPS as RuntimeSettingsGroup[]) {
    const incoming = patch[group];
    if (incoming === undefined) continue;
    merged[group] = mergeGroup(base[group], incoming);
  }
  return runtimeSettingsSchema.parse(merged);
}
