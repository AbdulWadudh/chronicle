import { STATS } from "./rules";
import type { StatBlock, StatDefinition, StatRank } from "./types";

const CUMULATIVE_COST: readonly number[] = [0, 0, 1, 2, 4, 6];
const MODIFIER_PIVOT = 3;

function clampRank(rank: number): number {
  return Math.min(Math.max(Math.trunc(rank), STATS.minRank), STATS.maxRank);
}

export function clampStatRank(rank: number): StatRank {
  return clampRank(rank) as StatRank;
}

export function cumulativeCostOfRank(rank: number): number {
  return CUMULATIVE_COST[clampRank(rank)] ?? 0;
}

export function costOfNextRank(rank: number): number | null {
  if (rank >= STATS.maxRank) return null;
  return cumulativeCostOfRank(rank + 1) - cumulativeCostOfRank(rank);
}

export function totalSpent(stats: StatBlock): number {
  return Object.values(stats).reduce((sum, rank) => sum + cumulativeCostOfRank(rank), 0);
}

export function remainingPoints(stats: StatBlock, budget: number): number {
  return budget - totalSpent(stats);
}

export function canRaise(stats: StatBlock, statId: string, budget: number): boolean {
  const step = costOfNextRank(stats[statId] ?? STATS.minRank);
  if (step === null) return false;
  return remainingPoints(stats, budget) >= step;
}

export function canLower(stats: StatBlock, statId: string): boolean {
  return (stats[statId] ?? STATS.minRank) > STATS.minRank;
}

export function baselineStats(definitions: readonly StatDefinition[]): StatBlock {
  const stats: StatBlock = {};
  for (const definition of definitions) stats[definition.id] = STATS.minRank;
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
    if (rank < STATS.minRank || rank > STATS.maxRank) return false;
  }
  return totalSpent(stats) <= budget;
}

export function statModifier(rank: number): number {
  return clampRank(rank) - MODIFIER_PIVOT;
}
