import { API } from "@chronicle/config";
import { useQuery } from "@tanstack/react-query";
import { get } from "~/lib/api";
import type { CharacterSummary } from "~/lib/entities";
import { queryKeys } from "~/lib/queryKeys";

export interface WorldCastResult {
  cast: readonly CharacterSummary[];
  loading: boolean;
  error: string | null;
}

export function useWorldCast(
  worldId: string | null,
  excludeCharacterId: string | null,
): WorldCastResult {
  const query = useQuery({
    queryKey: queryKeys.characters(worldId),
    queryFn: () => get<{ items: CharacterSummary[] }>(`${API.characters}?worldId=${worldId}`),
    enabled: worldId !== null,
  });

  const cast = (query.data?.items ?? []).filter((member) => member.id !== excludeCharacterId);

  return {
    cast,
    loading: query.isPending && worldId !== null,
    error: query.error === null ? null : query.error.message,
  };
}
