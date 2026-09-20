import { db, schema, toWorld } from "@chronicle/db";
import { COMPOSE_FIELD, composeRequestSchema, type World } from "@chronicle/utils";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { type AuthEnv, requireSession } from "~/auth";
import { composeField } from "~/engine/compose";

async function readableWorld(worldId: string, userId: string): Promise<World | null> {
  const row = await db.select().from(schema.worlds).where(eq(schema.worlds.id, worldId)).get();
  if (row === undefined) return null;
  if (row.visibility === "private" && row.userId !== userId) return null;
  return toWorld(row);
}

export const composeRoutes = new Hono<AuthEnv>()
  .use("*", requireSession)
  .post("/", async (context) => {
    const body = composeRequestSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) return context.json({ error: "Invalid compose request." }, 400);

    const request = body.data;
    if (request.mode === "enhance" && request.context[COMPOSE_FIELD[request.target]].length === 0) {
      return context.json({ error: "There is nothing to enhance yet." }, 400);
    }

    const user = context.get("user");
    const world = request.worldId === null ? null : await readableWorld(request.worldId, user.id);
    if (request.worldId !== null && world === null) {
      return context.json({ error: "World not found." }, 404);
    }

    try {
      const value = await composeField(request, world);
      if (value.length === 0) {
        return context.json({ error: "The game master returned nothing." }, 502);
      }
      return context.json({ value });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "The game master did not answer.";
      return context.json({ error: reason }, 502);
    }
  });
