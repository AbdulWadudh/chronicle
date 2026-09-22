import { API } from "@chronicle/config";
import type { RenderStyle, ShotSize } from "@chronicle/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { get, patch } from "~/lib/api";
import type { WorldDetail } from "~/lib/entities";
import { queryKeys } from "~/lib/queryKeys";

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
  const queryClient = useQueryClient();
  const [visualStyle, setVisualStyle] = useState("");
  const [shotSize, setShotSize] = useState<ShotSize>("waistUp");
  const [artStyle, setArtStyle] = useState<RenderStyle>("photoreal");

  const world = useQuery({
    queryKey: queryKeys.world(worldId),
    queryFn: () => get<WorldDetail>(`${API.worlds}/${worldId}`),
    enabled: worldId !== null,
  });

  useEffect(() => {
    if (world.data === undefined) return;
    setVisualStyle(world.data.visualStyle);
    setShotSize(world.data.shotSize);
    setArtStyle(world.data.artStyle);
  }, [world.data]);

  const saving = useMutation({
    mutationFn: () =>
      patch(`${API.worlds}/${worldId}`, {
        visualStyle: visualStyle.trim(),
        shotSize,
        artStyle,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.world(worldId) });
      void queryClient.invalidateQueries({ queryKey: ["worlds"] });
    },
  });

  const save = useCallback(async (): Promise<void> => {
    if (worldId === null) return;
    await saving.mutateAsync();
  }, [worldId, saving]);

  const failure = world.error ?? saving.error;

  return {
    visualStyle,
    shotSize,
    artStyle,
    loaded: world.isSuccess,
    saving: saving.isPending,
    error: failure === null || failure === undefined ? null : failure.message,
    setVisualStyle,
    setShotSize,
    setArtStyle,
    save,
  };
}
