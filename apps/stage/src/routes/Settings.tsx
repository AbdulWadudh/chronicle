import {
  API,
  type RuntimeSettings,
  type RuntimeSettingsPatch,
  runtimeSettingsSchema,
} from "@chronicle/shared";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BackButton } from "~/components/common/BackButton";
import { NumberField } from "~/components/common/NumberField";
import { PageHeader } from "~/components/common/PageHeader";
import { Screen } from "~/components/common/Screen";
import { Spinner } from "~/components/common/Spinner";
import { get, patch, post } from "~/lib/api";

interface SettingsResponse {
  settings: RuntimeSettings;
  defaults: RuntimeSettings;
}

type Group = keyof RuntimeSettings;

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

export function Settings() {
  const navigate = useNavigate();
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

  const back = <BackButton onPress={() => void navigate(-1)} />;

  if (settings === null) {
    return (
      <Screen wide>
        <PageHeader title="Runtime settings" leading={back} />
        <div className="flex flex-1 items-center justify-center text-text-muted">
          {error === null ? (
            <Spinner size={22} label="Loading settings" />
          ) : (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
        </div>
      </Screen>
    );
  }

  const groups = Object.keys(runtimeSettingsSchema.shape) as Group[];

  return (
    <Screen wide>
      <PageHeader
        title="Runtime settings"
        leading={back}
        trailing={
          <button
            type="button"
            onClick={() => void reset()}
            disabled={saving}
            className="rounded-full px-3 py-2 text-[13px] text-text-accent disabled:opacity-40"
          >
            Reset
          </button>
        }
      />

      <div aria-live="polite" className="flex shrink-0 items-center gap-2 pb-2 text-text-muted">
        {saving ? <Spinner label="Saving" /> : null}
        {error !== null ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <div className="scrollbar-none flex flex-1 flex-col gap-5 overflow-y-auto pb-6">
        {groups.map((group) => (
          <section key={group} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {group}
            </h2>
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
                <label key={field} className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">{field}</span>
                  <input
                    defaultValue={String(value)}
                    onBlur={(event) => void save({ [group]: { [field]: event.target.value } })}
                    className="rounded-xl border border-card-border bg-input-surface px-4 py-3 text-text-primary outline-none"
                  />
                </label>
              ),
            )}
          </section>
        ))}
      </div>
    </Screen>
  );
}
