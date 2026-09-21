import { db, newId, schema, toTurnNode } from "@chronicle/db";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { type AuthEnv, requireSession } from "~/auth";
import { enqueueScene } from "~/engine/imagery";
import { loadTurnContext } from "~/ws/loader";
import { ownTurnFor } from "~/ws/media";
import { nextVariant } from "~/ws/regenerate";

const sceneSchema = z.object({
  prompt: z.string().trim().max(600).nullable().default(null),
});

const checkpointSchema = z.object({
  turnId: z.string().min(1),
  name: z.string().min(1),
});

async function ownsCharacter(characterId: string, userId: string): Promise<boolean> {
  const row = await db
    .select({ id: schema.characters.id })
    .from(schema.characters)
    .where(and(eq(schema.characters.id, characterId), eq(schema.characters.userId, userId)))
    .get();
  return row !== undefined;
}

export const turnRoutes = new Hono<AuthEnv>()
  .use("*", requireSession)
  .get("/", async (context) => {
    const characterId = new URL(context.req.url).searchParams.get("characterId");
    if (characterId === null) return context.json({ error: "characterId is required." }, 400);
    const user = context.get("user");
    if (!(await ownsCharacter(characterId, user.id))) {
      return context.json({ error: "Not found." }, 404);
    }
    const items = await db
      .select()
      .from(schema.turns)
      .where(eq(schema.turns.characterId, characterId))
      .orderBy(asc(schema.turns.createdAt))
      .all();
    return context.json({ items: items.map(toTurnNode) });
  })
  .post("/:turnId/scene", async (context) => {
    const body = sceneSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) return context.json({ error: "Invalid scene prompt." }, 400);

    const turnId = context.req.param("turnId");
    const turn = await db.select().from(schema.turns).where(eq(schema.turns.id, turnId)).get();
    if (turn === undefined) return context.json({ error: "Turn not found." }, 404);

    const user = context.get("user");
    const loaded = await loadTurnContext(turn.characterId, user.id, turn.parentId);
    if (loaded === null) return context.json({ error: "Turn not found." }, 404);

    ownTurnFor(turnId, user.id, turn.characterId);

    const subject = body.data.prompt;
    await enqueueScene(
      loaded.world,
      loaded.character,
      turnId,
      turn.narrativeText,
      turn.sceneShape,
      nextVariant(turn.sceneImageUrl),
      subject === null || subject.length === 0 ? undefined : subject,
    );
    return context.json({ turnId, queued: true }, 202);
  })
  .post("/checkpoints", async (context) => {
    const body = checkpointSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) return context.json({ error: "Invalid checkpoint." }, 400);

    const user = context.get("user");
    const turn = await db
      .select()
      .from(schema.turns)
      .where(eq(schema.turns.id, body.data.turnId))
      .get();
    if (turn === undefined) return context.json({ error: "Turn not found." }, 404);
    if (!(await ownsCharacter(turn.characterId, user.id))) {
      return context.json({ error: "Turn not found." }, 404);
    }
    const character = await db
      .select()
      .from(schema.characters)
      .where(eq(schema.characters.id, turn.characterId))
      .get();
    if (character === undefined) return context.json({ error: "Turn not found." }, 404);
    const world = await db
      .select()
      .from(schema.worlds)
      .where(eq(schema.worlds.id, character.worldId))
      .get();
    if (world === undefined) return context.json({ error: "World not found." }, 404);

    const checkpoint = {
      id: newId(),
      turnId: turn.id,
      characterId: turn.characterId,
      worldId: world.id,
      name: body.data.name,
      snapshotJson: world.initialStateJson,
      createdAt: new Date(),
    };
    await db.insert(schema.checkpoints).values(checkpoint);
    return context.json(checkpoint, 201);
  })
  .get("/checkpoints", async (context) => {
    const characterId = new URL(context.req.url).searchParams.get("characterId");
    if (characterId === null) return context.json({ error: "characterId is required." }, 400);
    const user = context.get("user");
    if (!(await ownsCharacter(characterId, user.id))) {
      return context.json({ error: "Not found." }, 404);
    }
    const items = await db
      .select()
      .from(schema.checkpoints)
      .where(eq(schema.checkpoints.characterId, characterId))
      .orderBy(asc(schema.checkpoints.createdAt))
      .all();
    return context.json({ items });
  });
