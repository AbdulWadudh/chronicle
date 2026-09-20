import type {
  Pronouns,
  StatBlock,
  StatDefinition,
  WorldState,
  WorldVisibility,
} from "@chronicle/utils";

export interface WorldSummary {
  id: string;
  title: string;
  description: string;
  genre: string;
  coverImageUrl: string | null;
  visibility: WorldVisibility;
}

export interface WorldDetail extends WorldSummary {
  statDefinitionsJson: StatDefinition[];
  initialStateJson: WorldState;
  pointBudget: number;
}

export interface CharacterSummary {
  id: string;
  worldId: string;
  name: string;
  bio: string;
  pronouns: Pronouns;
  portraitUrl: string | null;
  statsJson: StatBlock;
}
