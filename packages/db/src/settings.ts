import {
  DEFAULT_RUNTIME_SETTINGS,
  type RuntimeSettings,
  type RuntimeSettingsPatch,
  runtimeSettingsSchema,
  SETTINGS_ROW_ID,
} from "@chronicle/config";
import { mergeRuntimeSettings } from "@chronicle/utils";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { settings } from "./schema/settings";

let cache: RuntimeSettings | null = null;
const listeners = new Set<(next: RuntimeSettings) => void>();

export function onSettingsChanged(listener: (next: RuntimeSettings) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function invalidateSettings(): void {
  cache = null;
}

export function cachedSettings(): RuntimeSettings {
  return cache ?? DEFAULT_RUNTIME_SETTINGS;
}

export async function loadSettings(): Promise<RuntimeSettings> {
  if (cache !== null) return cache;
  const row = await db.select().from(settings).where(eq(settings.id, SETTINGS_ROW_ID)).get();
  const parsed = runtimeSettingsSchema.safeParse(row?.valueJson ?? {});
  cache = parsed.success ? parsed.data : DEFAULT_RUNTIME_SETTINGS;
  return cache;
}

export async function updateSettings(
  patch: RuntimeSettingsPatch,
  updatedBy: string | null = null,
): Promise<RuntimeSettings> {
  const next = mergeRuntimeSettings(await loadSettings(), patch);
  const row = {
    id: SETTINGS_ROW_ID,
    valueJson: next,
    updatedAt: new Date(),
    updatedBy,
  };
  await db.insert(settings).values(row).onConflictDoUpdate({ target: settings.id, set: row });
  cache = next;
  for (const listener of listeners) listener(next);
  return next;
}

export async function resetSettings(updatedBy: string | null = null): Promise<RuntimeSettings> {
  cache = null;
  return updateSettings(DEFAULT_RUNTIME_SETTINGS, updatedBy);
}
