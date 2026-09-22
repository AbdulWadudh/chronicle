import { API, type RuntimeSettings, type RuntimeSettingsPatch } from "@chronicle/config";
import { mergeRuntimeSettings } from "@chronicle/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { get, patch, post } from "~/lib/api";
import { queryKeys } from "~/lib/queryKeys";

const SAVE_DEBOUNCE_MS = 400;
const SAVED_BADGE_MS = 1600;

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
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SaveStatus>("idle");

  const queued = useRef<RuntimeSettingsPatch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badge = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => get<SettingsResponse>(API.settings),
  });

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
      if (badge.current !== null) clearTimeout(badge.current);
    },
    [],
  );

  const store = useCallback(
    (settings: RuntimeSettings) => {
      queryClient.setQueryData<SettingsResponse>(queryKeys.settings(), (current) =>
        current === undefined ? current : { ...current, settings },
      );
    },
    [queryClient],
  );

  const save = useMutation({
    mutationFn: (body: RuntimeSettingsPatch) =>
      patch<{ settings: RuntimeSettings }>(API.settings, body),
    onSuccess: (response) => {
      store(response.settings);
      setStatus("saved");
      if (badge.current !== null) clearTimeout(badge.current);
      badge.current = setTimeout(() => setStatus("idle"), SAVED_BADGE_MS);
    },
    onError: (cause: Error) => {
      setStatus("failed");
      toast.error("That change did not save", { description: cause.message });
    },
  });

  const restore = useMutation({
    mutationFn: () => post<{ settings: RuntimeSettings }>(`${API.settings}/reset`, {}),
    onSuccess: (response) => {
      store(response.settings);
      setStatus("idle");
      toast.success("Defaults restored", {
        description: "Every runtime setting is back to its shipped value.",
      });
    },
    onError: (cause: Error) => {
      setStatus("failed");
      toast.error("Could not restore defaults", { description: cause.message });
    },
  });

  const update = useCallback(
    (next: RuntimeSettingsPatch) => {
      const current = query.data?.settings;
      if (current !== undefined) store(mergeRuntimeSettings(current, next));

      for (const [group, values] of Object.entries(next)) {
        const existing = queued.current[group as keyof RuntimeSettingsPatch] ?? {};
        Object.assign(queued.current, { [group]: { ...existing, ...values } });
      }

      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const body = queued.current;
        queued.current = {};
        if (Object.keys(body).length === 0) return;
        setStatus("saving");
        save.mutate(body);
      }, SAVE_DEBOUNCE_MS);
    },
    [query.data, save, store],
  );

  const reset = useCallback(() => {
    setStatus("saving");
    restore.mutate();
  }, [restore]);

  const failure = query.error ?? save.error ?? restore.error;

  return {
    settings: query.data?.settings ?? null,
    status,
    error: failure === null || failure === undefined ? null : failure.message,
    update,
    reset,
  };
}
