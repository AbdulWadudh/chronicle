import { MAX_STAT_RANK, MIN_STAT_RANK, type StatBlock, type StatDefinition } from "./types";

export const DEFAULT_POINT_BUDGET = 20;

const CUMULATIVE_RANK_COST: readonly number[] = [0, 0, 1, 2, 4, 6];

export function cumulativeCostOfRank(rank: number): number {
  const clamped = Math.min(Math.max(Math.trunc(rank), MIN_STAT_RANK), MAX_STAT_RANK);
  return CUMULATIVE_RANK_COST[clamped] ?? 0;
}

export function costOfNextRank(rank: number): number | null {
  if (rank >= MAX_STAT_RANK) return null;
  return cumulativeCostOfRank(rank + 1) - cumulativeCostOfRank(rank);
}

export function totalSpent(stats: StatBlock): number {
  return Object.values(stats).reduce((sum, rank) => sum + cumulativeCostOfRank(rank), 0);
}

export function remainingPoints(stats: StatBlock, budget: number): number {
  return budget - totalSpent(stats);
}

export function canRaise(stats: StatBlock, statId: string, budget: number): boolean {
  const current = stats[statId] ?? MIN_STAT_RANK;
  const step = costOfNextRank(current);
  if (step === null) return false;
  return remainingPoints(stats, budget) >= step;
}

export function canLower(stats: StatBlock, statId: string): boolean {
  return (stats[statId] ?? MIN_STAT_RANK) > MIN_STAT_RANK;
}

export function baselineStats(definitions: readonly StatDefinition[]): StatBlock {
  const stats: StatBlock = {};
  for (const definition of definitions) stats[definition.id] = MIN_STAT_RANK;
  return stats;
}

export function isValidBuild(
  stats: StatBlock,
  definitions: readonly StatDefinition[],
  budget: number,
): boolean {
  const declared = new Set(definitions.map((definition) => definition.id));
  if (Object.keys(stats).length !== declared.size) return false;
  for (const [statId, rank] of Object.entries(stats)) {
    if (!declared.has(statId)) return false;
    if (rank < MIN_STAT_RANK || rank > MAX_STAT_RANK) return false;
  }
  return totalSpent(stats) <= budget;
}

export function statModifier(rank: number): number {
  return Math.min(Math.max(Math.trunc(rank), MIN_STAT_RANK), MAX_STAT_RANK) - 3;
}
