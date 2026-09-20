import { db, schema, toCharacter } from "@chronicle/db";
import type { World } from "@chronicle/utils";
import { draftCast } from "~/engine/cast";
import { enqueuePortrait } from "~/engine/imagery";

async function persist(world: World): Promise<void> {
  const drafted = await draftCast(world);
  if (drafted.length === 0) throw new Error("The game master proposed no cast");

  const rows = await db
    .insert(schema.characters)
    .values(
      drafted.map((member) => ({
        worldId: world.id,
        userId: world.userId,
        name: member.name,
        bio: member.bio,
        pronouns: member.pronouns,
        statsJson: member.stats,
        inventoryJson: [],
      })),
    )
    .returning();

  for (const row of rows) await enqueuePortrait(world, toCharacter(row));
}

export function populateCast(world: World): void {
  persist(world).catch((error: unknown) => {
    console.error(`[director] could not cast ${world.title}:`, error);
  });
}
