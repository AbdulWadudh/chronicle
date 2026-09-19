import {
  API,
  type RuntimeSettings,
  type RuntimeSettingsPatch,
  runtimeSettingsSchema,
} from "@chronicle/shared";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NumberField } from "~/components/common/NumberField";
import { get, patch, post } from "~/lib/api";

interface SettingsResponse {
  settings: RuntimeSettings;
  defaults: RuntimeSettings;
}

type Group = keyof RuntimeSettings;

const SCROLL_STYLE = { gap: 20, padding: 16 } as const;

const FIELD_BOUNDS: Record<string, { min: number; max: number; step?: number }> = {
  temperature: { min: 0, max: 2, step: 0.1 },
  maxTokens: { min: 64, max: 8192, step: 64 },
  historyDepth: { min: 1, max: 40 },
  recentFacts: { min: 1, max: 40 },
  sceneChars: { min: 64, max: 2000, step: 32 },
  bufferSize: { min: 1, max: 512, step: 8 },
  width: { min: 256, max: 2048, step: 128 },
  height: { min: 256, max: 2048, step: 128 },
  steps: { min: 1, max: 50 },
  speed: { min: 0.25, max: 4, step: 0.25 },
  defaultDifficulty: { min: 5, max: 30 },
};

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<RuntimeSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void get<SettingsResponse>(API.settings)
      .then((response) => setSettings(response.settings))
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Could not load settings."),
      );
  }, []);

  async function save(next: RuntimeSettingsPatch): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const response = await patch<{ settings: RuntimeSettings }>(API.settings, next);
      setSettings(response.settings);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function reset(): Promise<void> {
    setSaving(true);
    try {
      const response = await post<{ settings: RuntimeSettings }>(`${API.settings}/reset`, {});
      setSettings(response.settings);
    } finally {
      setSaving(false);
    }
  }

  if (settings === null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas">
        {error === null ? <ActivityIndicator /> : <Text className="text-danger">{error}</Text>}
      </SafeAreaView>
    );
  }

  const groups = Object.keys(runtimeSettingsSchema.shape) as Group[];

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
          <Text className="text-text-muted">← Back</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-text-primary">Runtime settings</Text>
        <Pressable onPress={() => void reset()} hitSlop={8} accessibilityRole="button">
          <Text className="text-text-accent">Reset</Text>
        </Pressable>
      </View>

      {error !== null ? <Text className="px-4 text-danger">{error}</Text> : null}
      {saving ? <ActivityIndicator className="py-1" /> : null}

      <ScrollView contentContainerStyle={SCROLL_STYLE}>
        {groups.map((group) => (
          <View key={group} className="gap-2">
            <Text className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {group}
            </Text>
            {Object.entries(settings[group]).map(([field, value]) =>
              typeof value === "number" ? (
                <NumberField
                  key={field}
                  label={field}
                  value={value}
                  min={FIELD_BOUNDS[field]?.min ?? 0}
                  max={FIELD_BOUNDS[field]?.max ?? 100}
                  step={FIELD_BOUNDS[field]?.step ?? 1}
                  onChange={(next) => void save({ [group]: { [field]: next } })}
                />
              ) : (
                <View key={field} className="gap-1">
                  <Text className="text-xs text-text-muted">{field}</Text>
                  <TextInput
                    defaultValue={String(value)}
                    onEndEditing={(event) =>
                      void save({ [group]: { [field]: event.nativeEvent.text } })
                    }
                    className="rounded-xl border border-card-border bg-input-surface px-4 py-3 text-text-primary"
                  />
                </View>
              ),
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
