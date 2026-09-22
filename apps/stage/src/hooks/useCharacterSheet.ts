import { API } from "@chronicle/config";
import type { PaletteOverrides, StatBlock, StatDefinition } from "@chronicle/utils";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { get } from "~/lib/api";
import type { CharacterSummary, WorldDetail } from "~/lib/entities";
import { queryKeys } from "~/lib/queryKeys";

export interface CharacterSheet {
  name: string;
  worldTitle: string;
  worldId: string | null;
  statDefinitions: readonly StatDefinition[];
  stats: StatBlock;
  strengths: string;
  labelOf: (statId: string) => string;
  error: string | null;
  cast: CharacterSummary[];
  themeOverrides: PaletteOverrides | null;
}

const STRONG_RANK = 3;
const NO_DEFINITIONS: StatDefinition[] = [];

export function useCharacterSheet(characterId: string | null): CharacterSheet {
  const character = useQuery({
    queryKey: queryKeys.character(characterId),
    queryFn: () => get<CharacterSummary>(`${API.characters}/${characterId}`),
    enabled: characterId !== null,
  });

  const worldId = character.data?.worldId ?? null;

  const [world, cast] = useQueries({
    queries: [
      {
        queryKey: queryKeys.world(worldId),
        queryFn: () => get<WorldDetail>(`${API.worlds}/${worldId}`),
        enabled: worldId !== null,
      },
      {
        queryKey: queryKeys.characters(worldId),
        queryFn: () => get<{ items: CharacterSummary[] }>(`${API.characters}?worldId=${worldId}`),
        enabled: worldId !== null,
      },
    ],
  });

  const statDefinitions = world.data?.statDefinitionsJson ?? NO_DEFINITIONS;
  const stats = character.data?.statsJson ?? {};

  const labelOf = useCallback(
    (statId: string): string =>
      statDefinitions.find((definition) => definition.id === statId)?.label ?? statId,
    [statDefinitions],
  );

  const strengths = useMemo(
    () =>
      statDefinitions
        .filter((definition) => (stats[definition.id] ?? 1) >= STRONG_RANK)
        .map((definition) => definition.label)
        .join(", "),
    [statDefinitions, stats],
  );

  const members = useMemo(
    () => (cast.data?.items ?? []).filter((item) => item.id !== characterId),
    [cast.data, characterId],
  );

  const failure = character.error ?? world.error;

  return {
    name: character.data?.name ?? "",
    worldTitle: world.data?.title ?? "",
    worldId,
    statDefinitions,
    stats,
    strengths,
    labelOf,
    error: failure === null || failure === undefined ? null : failure.message,
    cast: members,
    themeOverrides: world.data?.themeOverrides ?? null,
  };
}
