import { API, type RuntimeSettings, type RuntimeSettingsPatch } from "@chronicle/config";
import { mergeRuntimeSettings } from "@chronicle/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { get, patch, post } from "~/lib/api";

const SAVE_DEBOUNCE_MS = 400;

interface SettingsResponse {
  settings: RuntimeSettings;
  defaults: RuntimeSettings;
}

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

export interface SettingsController {
  settings: RuntimeSettings | null;
  status: SaveStatus;
  error: string | null;
  update: (next: RuntimeSettingsPatch) => void;
  reset: () => void;
}

export function useSettings(): SettingsController {
  const [settings, setSettings] = useState<RuntimeSettings | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const queued = useRef<RuntimeSettingsPatch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFor = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void get<SettingsResponse>(API.settings)
      .then((response) => setSettings(response.settings))
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Could not load settings."),
      );
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      if (savedFor.current !== null) clearTimeout(savedFor.current);
    };
  }, []);

  const flush = useCallback(async (): Promise<void> => {
    const body = queued.current;
    queued.current = {};
    if (Object.keys(body).length === 0) return;

    setStatus("saving");
    setError(null);
    try {
      const response = await patch<{ settings: RuntimeSettings }>(API.settings, body);
      setSettings(response.settings);
      setStatus("saved");
      if (savedFor.current !== null) clearTimeout(savedFor.current);
      savedFor.current = setTimeout(() => setStatus("idle"), 1600);
    } catch (cause) {
      setStatus("failed");
      const message = cause instanceof Error ? cause.message : "Could not save that change.";
      setError(message);
      toast.error("That change did not save", { description: message });
    }
  }, []);

  const update = useCallback(
    (next: RuntimeSettingsPatch) => {
      setSettings((current) => (current === null ? current : mergeRuntimeSettings(current, next)));
      for (const [group, values] of Object.entries(next)) {
        const existing = queued.current[group as keyof RuntimeSettingsPatch] ?? {};
        Object.assign(queued.current, { [group]: { ...existing, ...values } });
      }
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  const reset = useCallback(() => {
    setStatus("saving");
    void post<{ settings: RuntimeSettings }>(`${API.settings}/reset`, {})
      .then((response) => {
        setSettings(response.settings);
        setStatus("idle");
        toast.success("Defaults restored", {
          description: "Every runtime setting is back to its shipped value.",
        });
      })
      .catch((cause: unknown) => {
        setStatus("failed");
        const message = cause instanceof Error ? cause.message : "Could not restore defaults.";
        setError(message);
        toast.error("Could not restore defaults", { description: message });
      });
  }, []);

  return { settings, status, error, update, reset };
}
