import { API } from "@chronicle/config";
import { useEffect, useState } from "react";
import { get } from "~/lib/api";
import type { CharacterSummary } from "~/lib/entities";

export interface WorldCastResult {
  cast: readonly CharacterSummary[];
  loading: boolean;
  error: string | null;
}

export function useWorldCast(
  worldId: string | null,
  excludeCharacterId: string | null,
): WorldCastResult {
  const [cast, setCast] = useState<readonly CharacterSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (worldId === null) {
      setCast([]);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const load = async (): Promise<void> => {
      const response = await get<{ items: CharacterSummary[] }>(
        `${API.characters}?worldId=${worldId}`,
      );
      if (cancelled) return;
      const filtered = response.items.filter((member) => member.id !== excludeCharacterId);
      setCast(filtered);
      setError(null);
      setLoading(false);
    };

    load().catch((cause: unknown) => {
      if (cancelled) return;
      setCast([]);
      setError(cause instanceof Error ? cause.message : "Could not load cast.");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [worldId, excludeCharacterId]);

  return { cast, loading, error };
}
