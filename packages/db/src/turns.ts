import type { TurnNode } from "@chronicle/utils";
import type { schema } from ".";

export type TurnRow = typeof schema.turns.$inferSelect;

export function toTurnNode(row: TurnRow): TurnNode {
  return {
    id: row.id,
    parentId: row.parentId,
    characterId: row.characterId,
    playerAction: row.playerAction,
    narrativeText: row.narrativeText,
    choices: row.choicesJson ?? [],
    sceneImageUrl: row.sceneImageUrl,
    sceneShape: row.sceneShape,
    audioUrls: row.audioUrlsJson ?? [],
    stateDiff: row.stateDiffJson,
    diceCheck: row.diceCheckJson,
    branchIndex: row.branchIndex,
    createdAt: row.createdAt,
  };
}
