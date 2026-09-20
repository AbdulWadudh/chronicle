import type {
  RuntimeSettings,
  RuntimeSettingsGroup,
  RuntimeSettingsPatch,
} from "@chronicle/config";
import { RUNTIME_SETTING_GROUPS, runtimeSettingsSchema } from "@chronicle/config";

export function mergeRuntimeSettings(
  base: RuntimeSettings,
  patch: RuntimeSettingsPatch,
): RuntimeSettings {
  const merged: Record<string, unknown> = { ...base };
  for (const group of RUNTIME_SETTING_GROUPS as RuntimeSettingsGroup[]) {
    const incoming = patch[group];
    if (incoming === undefined) continue;
    merged[group] = { ...base[group], ...incoming };
  }
  return runtimeSettingsSchema.parse(merged);
}
