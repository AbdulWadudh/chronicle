import { API } from "@chronicle/config";
import type { StatBlock, StatDefinition } from "@chronicle/utils";
import { useEffect, useState } from "react";
import { get } from "~/lib/api";

interface CharacterDetail {
  id: string;
  worldId: string;
  statsJson: StatBlock;
}

interface WorldDetail {
  statDefinitionsJson: StatDefinition[];
}

export interface CharacterSheet {
  statDefinitions: readonly StatDefinition[];
  stats: StatBlock;
}

const EMPTY: CharacterSheet = { statDefinitions: [], stats: {} };

export function useCharacterSheet(characterId: string | null): CharacterSheet {
  const [sheet, setSheet] = useState<CharacterSheet>(EMPTY);

  useEffect(() => {
    if (characterId === null) return;
    let cancelled = false;

    const load = async (): Promise<void> => {
      const character = await get<CharacterDetail>(`${API.characters}/${characterId}`);
      const world = await get<WorldDetail>(`${API.worlds}/${character.worldId}`);
      if (cancelled) return;
      setSheet({ statDefinitions: world.statDefinitionsJson, stats: character.statsJson });
    };

    load().catch(() => setSheet(EMPTY));

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  return sheet;
}
