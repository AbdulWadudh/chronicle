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
  narratorPrompt: string;
  narratorVoiceId: string | null;
  ensembleEnabled: boolean;
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
  likes: string;
  dislikes: string;
  responseStyle: string;
  eagerness: number;
  voiceId: string | null;
  statsJson: StatBlock;
}
