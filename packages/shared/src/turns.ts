import { z } from "zod";
import { statePatchSchema } from "./types";

export const diceCheckSchema = z.object({
  checkId: z.string(),
  stat: z.string(),
  dc: z.number().int(),
  baseModifier: z.number().int(),
  roll: z.number().int().min(1).max(20).nullable(),
  succeeded: z.boolean().nullable(),
});

export const turnChoiceSchema = z.object({
  label: z.string().min(1),
  hint: z.string().default(""),
});

export const sentenceAudioSchema = z.object({
  sentenceIndex: z.number().int().nonnegative(),
  audioUrl: z.string(),
});

export const turnNodeSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  characterId: z.string(),
  playerAction: z.string(),
  narrativeText: z.string(),
  choices: z.array(turnChoiceSchema),
  sceneImageUrl: z.string().nullable(),
  audioUrls: z.array(sentenceAudioSchema),
  stateDiff: statePatchSchema.nullable(),
  diceCheck: diceCheckSchema.nullable(),
  branchIndex: z.number().int().nonnegative(),
  createdAt: z.coerce.date(),
});

export type DiceCheck = z.infer<typeof diceCheckSchema>;
export type TurnChoice = z.infer<typeof turnChoiceSchema>;
export type SentenceAudio = z.infer<typeof sentenceAudioSchema>;
export type TurnNode = z.infer<typeof turnNodeSchema>;

export type TurnIndex = ReadonlyMap<string, TurnNode>;

export function indexTurns(turns: readonly TurnNode[]): TurnIndex {
  return new Map(turns.map((turn) => [turn.id, turn]));
}

export function childrenOf(turns: readonly TurnNode[], parentId: string | null): TurnNode[] {
  return turns
    .filter((turn) => turn.parentId === parentId)
    .sort((left, right) => left.branchIndex - right.branchIndex);
}

export function pathToRoot(index: TurnIndex, leafId: string): TurnNode[] {
  const path: TurnNode[] = [];
  const seen = new Set<string>();
  let cursor: string | null = leafId;
  while (cursor !== null && !seen.has(cursor)) {
    seen.add(cursor);
    const turn: TurnNode | undefined = index.get(cursor);
    if (turn === undefined) break;
    path.push(turn);
    cursor = turn.parentId;
  }
  return path.reverse();
}

export function isLeaf(turns: readonly TurnNode[], turnId: string): boolean {
  return !turns.some((turn) => turn.parentId === turnId);
}

export function nextBranchIndex(turns: readonly TurnNode[], parentId: string | null): number {
  const siblings = childrenOf(turns, parentId);
  const last = siblings.at(-1);
  return last === undefined ? 0 : last.branchIndex + 1;
}

export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}
