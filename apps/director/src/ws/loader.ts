import { db, schema, toCharacter, toWorld } from "@chronicle/db";
import {
  applyStatePatch,
  indexTurns,
  nextBranchIndex,
  pathToRoot,
  type TurnNode,
  turnNodeSchema,
} from "@chronicle/utils";
import { eq } from "drizzle-orm";
import type { TurnContext } from "~/ws/context";

export async function loadTurnContext(
  characterId: string,
  userId: string,
  parentTurnId: string | null,
): Promise<TurnContext | null> {
  const characterRow = await db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, characterId))
    .get();
  if (characterRow === undefined || characterRow.userId !== userId) return null;

  const worldRow = await db
    .select()
    .from(schema.worlds)
    .where(eq(schema.worlds.id, characterRow.worldId))
    .get();
  if (worldRow === undefined) return null;

  const character = toCharacter(characterRow);
  const world = toWorld(worldRow);

  const turnRows = await db
    .select()
    .from(schema.turns)
    .where(eq(schema.turns.characterId, characterId))
    .all();

  const turns = turnRows.map(
    (row): TurnNode =>
      turnNodeSchema.parse({
        ...row,
        choices: row.choicesJson,
        audioUrls: row.audioUrlsJson ?? [],
        stateDiff: row.stateDiffJson,
        diceCheck: row.diceCheckJson,
        cast: row.castJson,
      }),
  );

  const ancestry = parentTurnId === null ? [] : pathToRoot(indexTurns(turns), parentTurnId);

  const state = ancestry.reduce(
    (folded, turn) => (turn.stateDiff === null ? folded : applyStatePatch(folded, turn.stateDiff)),
    world.initialState,
  );

  return {
    db,
    world,
    character,
    state,
    ancestry,
    branchIndex: nextBranchIndex(turns, parentTurnId),
  };
}
