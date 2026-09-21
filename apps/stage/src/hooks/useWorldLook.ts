import { API } from "@chronicle/config";
import type { RenderStyle, ShotSize } from "@chronicle/utils";
import { useCallback, useEffect, useState } from "react";
import { get, patch } from "~/lib/api";
import type { WorldDetail } from "~/lib/entities";

export interface WorldLook {
  visualStyle: string;
  shotSize: ShotSize;
  artStyle: RenderStyle;
  loaded: boolean;
  saving: boolean;
  error: string | null;
  setVisualStyle: (value: string) => void;
  setShotSize: (value: ShotSize) => void;
  setArtStyle: (value: RenderStyle) => void;
  save: () => Promise<void>;
}

export function useWorldLook(worldId: string | null): WorldLook {
  const [visualStyle, setVisualStyle] = useState("");
  const [shotSize, setShotSize] = useState<ShotSize>("waistUp");
  const [artStyle, setArtStyle] = useState<RenderStyle>("photoreal");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (worldId === null) return;
    let current = true;
    setLoaded(false);
    get<WorldDetail>(`${API.worlds}/${worldId}`)
      .then((world) => {
        if (!current) return;
        setVisualStyle(world.visualStyle);
        setShotSize(world.shotSize);
        setArtStyle(world.artStyle);
        setLoaded(true);
      })
      .catch((cause: unknown) => {
        if (!current) return;
        setError(cause instanceof Error ? cause.message : "That world could not be read.");
      });
    return () => {
      current = false;
    };
  }, [worldId]);

  const save = useCallback(async (): Promise<void> => {
    if (worldId === null) return;
    setSaving(true);
    setError(null);
    try {
      await patch(`${API.worlds}/${worldId}`, {
        visualStyle: visualStyle.trim(),
        shotSize,
        artStyle,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That change could not be saved.");
    } finally {
      setSaving(false);
    }
  }, [worldId, visualStyle, shotSize, artStyle]);

  return {
    visualStyle,
    shotSize,
    artStyle,
    loaded,
    saving,
    error,
    setVisualStyle,
    setShotSize,
    setArtStyle,
    save,
  };
}
