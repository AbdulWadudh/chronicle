import type {
  PaletteOverrides,
  Pronouns,
  RenderStyle,
  ShotSize,
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
  visualStyle: string;
  shotSize: ShotSize;
  artStyle: RenderStyle;
  themeOverrides: PaletteOverrides | null;
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
  appearance: string;
  outfit: string;
  outfitLocked: boolean;
  pronouns: Pronouns;
  portraitUrl: string | null;
  draftPortraitUrl: string | null;
  statsJson: StatBlock;
}
