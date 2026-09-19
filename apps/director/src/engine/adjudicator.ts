import type { DiceCheck, StatBlock } from "@chronicle/shared";
import {
  CRITICAL_FAILURE,
  CRITICAL_SUCCESS,
  D20_SIDES,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  statModifier,
} from "@chronicle/shared";

export interface CheckProposal {
  stat: string;
  dc: number;
  reason: string;
}

export interface ResolvedCheck extends DiceCheck {
  total: number;
  critical: "success" | "failure" | null;
}

export function rollD20(): number {
  return 1 + Math.floor(Math.random() * D20_SIDES);
}

export function clampDifficulty(dc: number): number {
  return Math.min(Math.max(Math.trunc(dc), MIN_DIFFICULTY), MAX_DIFFICULTY);
}

export function isKnownStat(stat: string, stats: StatBlock): boolean {
  return Object.hasOwn(stats, stat);
}

export function resolveCheck(
  checkId: string,
  proposal: CheckProposal,
  stats: StatBlock,
  roll: number = rollD20(),
): ResolvedCheck {
  const dc = clampDifficulty(proposal.dc);
  const baseModifier = statModifier(stats[proposal.stat] ?? 1);
  const total = roll + baseModifier;
  const critical =
    roll === CRITICAL_SUCCESS ? "success" : roll === CRITICAL_FAILURE ? "failure" : null;
  const succeeded = critical === "success" ? true : critical === "failure" ? false : total >= dc;
  return { checkId, stat: proposal.stat, dc, baseModifier, roll, succeeded, total, critical };
}

export function matchesServerRoll(resolved: ResolvedCheck, reportedRoll: number): boolean {
  return resolved.roll === reportedRoll;
}

export const CHECK_PROPOSAL_SCHEMA = {
  type: "object",
  properties: {
    requiresCheck: { type: "boolean" },
    stat: { type: "string" },
    dc: { type: "integer", minimum: MIN_DIFFICULTY, maximum: MAX_DIFFICULTY },
    reason: { type: "string" },
  },
  required: ["requiresCheck"],
  additionalProperties: false,
} as const;
