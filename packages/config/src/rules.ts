export const DICE = {
  sides: 20,
  criticalSuccess: 20,
  criticalFailure: 1,
  minDifficulty: 5,
  maxDifficulty: 30,
} as const;

export const STATS = {
  minRank: 1,
  maxRank: 5,
  defaultPointBudget: 20,
} as const;
