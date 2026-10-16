import { db, schema } from "@chronicle/db";
import { eq } from "drizzle-orm";
import { closeQueues, memoryQueue } from "~/queue";

const turns = await db
  .select({
    id: schema.turns.id,
    characterId: schema.turns.characterId,
    worldId: schema.characters.worldId,
    playerAction: schema.turns.playerAction,
    narrativeText: schema.turns.narrativeText,
  })
  .from(schema.turns)
  .innerJoin(schema.characters, eq(schema.characters.id, schema.turns.characterId));

await memoryQueue.addBulk(
  turns
    .filter((turn) => turn.narrativeText.length > 0)
    .map((turn) => ({
      name: "episode",
      data: {
        turnId: turn.id,
        characterId: turn.characterId,
        worldId: turn.worldId,
        playerAction: turn.playerAction,
        narrativeText: turn.narrativeText,
        summarise: null,
      },
    })),
);

console.log(`queued ${turns.length} turns for embedding`);
await closeQueues();
