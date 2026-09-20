import { API } from "@chronicle/config";
import type { StatBlock, StatDefinition } from "@chronicle/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { get } from "~/lib/api";
import type { CharacterSummary, WorldDetail } from "~/lib/entities";

export interface CharacterSheet {
  name: string;
  worldTitle: string;
  statDefinitions: readonly StatDefinition[];
  stats: StatBlock;
  strengths: string;
  labelOf: (statId: string) => string;
  error: string | null;
}

interface Loaded {
  name: string;
  worldTitle: string;
  statDefinitions: StatDefinition[];
  stats: StatBlock;
}

const EMPTY: Loaded = { name: "", worldTitle: "", statDefinitions: [], stats: {} };
const STRONG_RANK = 3;

export function useCharacterSheet(characterId: string | null): CharacterSheet {
  const [sheet, setSheet] = useState<Loaded>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (characterId === null) return;
    let cancelled = false;

    const load = async (): Promise<void> => {
      const character = await get<CharacterSummary>(`${API.characters}/${characterId}`);
      const world = await get<WorldDetail>(`${API.worlds}/${character.worldId}`);
      if (cancelled) return;
      setSheet({
        name: character.name,
        worldTitle: world.title,
        statDefinitions: world.statDefinitionsJson,
        stats: character.statsJson,
      });
      setError(null);
    };

    load().catch((cause: unknown) => {
      if (cancelled) return;
      setSheet(EMPTY);
      setError(cause instanceof Error ? cause.message : "Could not load this character.");
    });

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  const labelOf = useCallback(
    (statId: string): string =>
      sheet.statDefinitions.find((definition) => definition.id === statId)?.label ?? statId,
    [sheet.statDefinitions],
  );

  const strengths = useMemo(
    () =>
      sheet.statDefinitions
        .filter((definition) => (sheet.stats[definition.id] ?? 1) >= STRONG_RANK)
        .map((definition) => definition.label)
        .join(", "),
    [sheet],
  );

  return {
    name: sheet.name,
    worldTitle: sheet.worldTitle,
    statDefinitions: sheet.statDefinitions,
    stats: sheet.stats,
    strengths,
    labelOf,
    error,
  };
}
