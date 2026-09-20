export const DICE = {
  sides: 20,
  criticalSuccess: 20,
  criticalFailure: 1,
  minDifficulty: 5,
  maxDifficulty: 30,
} as const;

export const IMAGE_SHAPES = {
  square: { width: 1024, height: 1024 },
  portrait: { width: 832, height: 1216 },
  landscape: { width: 1216, height: 832 },
} as const;

export const STATS = {
  minRank: 1,
  maxRank: 5,
  defaultPointBudget: 20,
} as const;
