import { db, schema, toCharacter, toWorld } from "@chronicle/db";
import {
  characterPortraitKey,
  inventorySchema,
  isValidBuild,
  pronounsSchema,
  statBlockSchema,
} from "@chronicle/utils";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { type AuthEnv, requireSession } from "~/auth";
import { enqueuePortrait } from "~/engine/imagery";
import { UPLOAD_MAX_BYTES, UPLOAD_TYPES, upload } from "~/storage";

const portraitSchema = z.object({ prompt: z.string().min(1).max(600).optional() });

const patchCharacterSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  pronouns: pronounsSchema.optional(),
  stats: statBlockSchema.optional(),
});

const createCharacterSchema = z.object({
  worldId: z.string().min(1),
  name: z.string().min(1),
  bio: z.string().default(""),
  pronouns: pronounsSchema.default("they"),
  portraitUrl: z.string().nullable().default(null),
  stats: statBlockSchema,
  inventory: inventorySchema.default([]),
});

async function readableWorld(worldId: string, userId: string) {
  const row = await db.select().from(schema.worlds).where(eq(schema.worlds.id, worldId)).get();
  if (row === undefined) return null;
  if (row.visibility === "private" && row.userId !== userId) return null;
  return row;
}

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
    const worldRow = await readableWorld(body.data.worldId, user.id);
    if (worldRow === null) return context.json({ error: "World not found." }, 404);
    if (!isValidBuild(body.data.stats, worldRow.statDefinitionsJson, worldRow.pointBudget)) {
      return context.json({ error: "Stat build exceeds the point budget." }, 400);
    }

    const [row] = await db
      .insert(schema.characters)
      .values({
        worldId: body.data.worldId,
        userId: user.id,
        name: body.data.name,
        bio: body.data.bio,
        pronouns: body.data.pronouns,
        portraitUrl: body.data.portraitUrl,
        statsJson: body.data.stats,
        inventoryJson: body.data.inventory,
      })
      .returning();
    if (row === undefined) return context.json({ error: "The character was not written." }, 500);

    if (row.portraitUrl === null) await enqueuePortrait(toWorld(worldRow), toCharacter(row));
    return context.json(row, 201);
  })
  .patch("/:id", async (context) => {
    const body = patchCharacterSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) return context.json({ error: "Invalid character." }, 400);

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

    const worldRow = await readableWorld(row.worldId, user.id);
    if (worldRow === null) return context.json({ error: "World not found." }, 404);

    const stats = body.data.stats ?? row.statsJson;
    if (!isValidBuild(stats, worldRow.statDefinitionsJson, worldRow.pointBudget)) {
      return context.json({ error: "Stat build exceeds the point budget." }, 400);
    }

    const [updated] = await db
      .update(schema.characters)
      .set({
        name: body.data.name ?? row.name,
        bio: body.data.bio ?? row.bio,
        pronouns: body.data.pronouns ?? row.pronouns,
        statsJson: stats,
      })
      .where(eq(schema.characters.id, row.id))
      .returning();
    if (updated === undefined) return context.json({ error: "The change was not saved." }, 500);
    return context.json(updated);
  })
  .delete("/:id", async (context) => {
    const user = context.get("user");
    await db
      .delete(schema.characters)
      .where(
        and(
          eq(schema.characters.id, context.req.param("id")),
          eq(schema.characters.userId, user.id),
        ),
      );
    return context.body(null, 204);
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
  })
  .put("/:id/portrait", async (context) => {
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

    const type = context.req.header("content-type") ?? "";
    const extension = UPLOAD_TYPES[type.split(";")[0]?.trim() ?? ""];
    if (extension === undefined) {
      return context.json({ error: "Upload a PNG, JPEG or WebP image." }, 415);
    }

    const bytes = new Uint8Array(await context.req.arrayBuffer());
    if (bytes.byteLength === 0) return context.json({ error: "That file was empty." }, 400);
    if (bytes.byteLength > UPLOAD_MAX_BYTES) {
      return context.json({ error: "That image is larger than 8 MB." }, 413);
    }

    const portraitUrl = await upload(characterPortraitKey(row.worldId, row.id), bytes, type);
    await db.update(schema.characters).set({ portraitUrl }).where(eq(schema.characters.id, row.id));
    return context.json({ portraitUrl });
  })
  .post("/:id/portrait", async (context) => {
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
    const worldRow = await readableWorld(row.worldId, user.id);
    if (worldRow === null) return context.json({ error: "World not found." }, 404);
    const body = await context.req.json().catch(() => null);
    const override = portraitSchema.safeParse(body);
    await enqueuePortrait(
      toWorld(worldRow),
      toCharacter(row),
      override.success ? override.data.prompt : undefined,
    );
    return context.json({ status: "queued" }, 202);
  });
