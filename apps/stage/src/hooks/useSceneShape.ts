import { API } from "@chronicle/config";
import { useEffect, useState } from "react";
import { get } from "~/lib/api";

const FALLBACK_ASPECT = 1;

interface SettingsResponse {
  settings: { image: { width: number; height: number } };
}

export function useSceneAspect(): number {
  const [aspect, setAspect] = useState(FALLBACK_ASPECT);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await get<SettingsResponse>(API.settings);
        if (cancelled) return;
        const { width, height } = data.settings.image;
        if (width > 0 && height > 0) setAspect(width / height);
      } catch (cause) {
        console.error("[stage] could not read the scene shape:", cause);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return aspect;
}
