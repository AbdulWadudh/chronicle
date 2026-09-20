import { db, schema } from "@chronicle/db";
import { inventorySchema, isValidBuild, statBlockSchema } from "@chronicle/utils";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { type AuthEnv, requireSession } from "~/auth";

const createCharacterSchema = z.object({
  worldId: z.string().min(1),
  name: z.string().min(1),
  bio: z.string().default(""),
  portraitUrl: z.string().nullable().default(null),
  stats: statBlockSchema,
  inventory: inventorySchema.default([]),
});

export const characterRoutes = new Hono<AuthEnv>()
  .use("*", requireSession)
  .get("/", async (context) => {
    const user = context.get("user");
    const worldId = new URL(context.req.url).searchParams.get("worldId");
    const filter =
      worldId === null
        ? eq(schema.characters.userId, user.id)
        : and(eq(schema.characters.userId, user.id), eq(schema.characters.worldId, worldId));
    const items = await db
      .select()
      .from(schema.characters)
      .where(filter)
      .orderBy(desc(schema.characters.createdAt))
      .all();
    return context.json({ items });
  })
  .post("/", async (context) => {
    const body = createCharacterSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) return context.json({ error: "Invalid character." }, 400);

    const user = context.get("user");
    const world = await db
      .select()
      .from(schema.worlds)
      .where(eq(schema.worlds.id, body.data.worldId))
      .get();
    if (world === undefined) return context.json({ error: "World not found." }, 404);
    if (world.visibility === "private" && world.userId !== user.id) {
      return context.json({ error: "World not found." }, 404);
    }
    if (!isValidBuild(body.data.stats, world.statDefinitionsJson, world.pointBudget)) {
      return context.json({ error: "Stat build exceeds the point budget." }, 400);
    }

    const [character] = await db
      .insert(schema.characters)
      .values({
        worldId: body.data.worldId,
        userId: user.id,
        name: body.data.name,
        bio: body.data.bio,
        portraitUrl: body.data.portraitUrl,
        statsJson: body.data.stats,
        inventoryJson: body.data.inventory,
      })
      .returning();
    if (character === undefined) {
      return context.json({ error: "The character was not written." }, 500);
    }
    return context.json(character, 201);
  })
  .get("/:id", async (context) => {
    const user = context.get("user");
    const row = await db
      .select()
      .from(schema.characters)
      .where(
        and(
          eq(schema.characters.id, context.req.param("id")),
          eq(schema.characters.userId, user.id),
        ),
      )
      .get();
    if (row === undefined) return context.json({ error: "Not found." }, 404);
    return context.json(row);
  });
