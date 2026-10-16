import { db, schema, toCharacter, toWorld } from "@chronicle/db";
import {
  characterDraftPortraitKey,
  characterPortraitKey,
  fetchBytes,
  isValidBuild,
  PORTRAIT_CONTENT_TYPE,
} from "@chronicle/utils";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { type AuthEnv, requireSession } from "~/auth";
import { enqueuePortrait } from "~/engine/imagery";
import { voiceRejection } from "~/engine/voices";
import {
  createCharacterSchema,
  ownedCharacter,
  patchCharacterSchema,
  portraitSchema,
  readableWorld,
} from "~/routes/characters/schemas";
import { UPLOAD_MAX_BYTES, UPLOAD_TYPES, upload } from "~/storage";

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
    const rejected = await voiceRejection(body.data.voiceId);
    if (rejected !== null) return context.json({ error: rejected }, 400);

    const { worldId, stats, inventory, ...fields } = body.data;
    const [row] = await db
      .insert(schema.characters)
      .values({ ...fields, worldId, userId: user.id, statsJson: stats, inventoryJson: inventory })
      .returning();
    if (row === undefined) return context.json({ error: "The character was not written." }, 500);

    if (row.portraitUrl === null) await enqueuePortrait(toWorld(worldRow), toCharacter(row));
    return context.json(row, 201);
  })
  .patch("/:id", async (context) => {
    const body = patchCharacterSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) return context.json({ error: "Invalid character." }, 400);

    const user = context.get("user");
    const row = await ownedCharacter(context.req.param("id"), user.id);
    if (row === null) return context.json({ error: "Not found." }, 404);

    const worldRow = await readableWorld(row.worldId, user.id);
    if (worldRow === null) return context.json({ error: "World not found." }, 404);

    const rejected = await voiceRejection(body.data.voiceId);
    if (rejected !== null) return context.json({ error: rejected }, 400);

    let portraitUrl = row.portraitUrl;
    let draftPortraitUrl = row.draftPortraitUrl;
    if (draftPortraitUrl !== null) {
      const bytes = await fetchBytes(draftPortraitUrl);
      const stored = await upload(
        characterPortraitKey(row.worldId, row.id),
        bytes,
        PORTRAIT_CONTENT_TYPE,
      );
      portraitUrl = `${stored.split("?")[0]}?v=${Date.now()}`;
      draftPortraitUrl = null;
    }

    const stats = body.data.stats ?? row.statsJson;
    if (!isValidBuild(stats, worldRow.statDefinitionsJson, worldRow.pointBudget)) {
      return context.json({ error: "Stat build exceeds the point budget." }, 400);
    }

    const [updated] = await db
      .update(schema.characters)
      .set({
        name: body.data.name ?? row.name,
        bio: body.data.bio ?? row.bio,
        appearance: body.data.appearance ?? row.appearance,
        outfit: body.data.outfit ?? row.outfit,
        outfitLocked: body.data.outfitLocked ?? row.outfitLocked,
        likes: body.data.likes ?? row.likes,
        dislikes: body.data.dislikes ?? row.dislikes,
        responseStyle: body.data.responseStyle ?? row.responseStyle,
        eagerness: body.data.eagerness ?? row.eagerness,
        voiceId: body.data.voiceId === undefined ? row.voiceId : body.data.voiceId,
        portraitUrl,
        draftPortraitUrl,
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
    const row = await ownedCharacter(context.req.param("id"), context.get("user").id);
    if (row === null) return context.json({ error: "Not found." }, 404);
    return context.json(row);
  })
  .put("/:id/portrait", async (context) => {
    const row = await ownedCharacter(context.req.param("id"), context.get("user").id);
    if (row === null) return context.json({ error: "Not found." }, 404);

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

    const draftPortraitUrl = await upload(
      characterDraftPortraitKey(row.worldId, row.id),
      bytes,
      type,
    );
    await db
      .update(schema.characters)
      .set({ draftPortraitUrl })
      .where(eq(schema.characters.id, row.id));
    return context.json({ draftPortraitUrl });
  })
  .delete("/:id/portrait/draft", async (context) => {
    const row = await ownedCharacter(context.req.param("id"), context.get("user").id);
    if (row === null) return context.json({ error: "Not found." }, 404);
    await db
      .update(schema.characters)
      .set({ draftPortraitUrl: null })
      .where(eq(schema.characters.id, row.id));
    return context.body(null, 204);
  })
  .post("/:id/portrait", async (context) => {
    const user = context.get("user");
    const row = await ownedCharacter(context.req.param("id"), user.id);
    if (row === null) return context.json({ error: "Not found." }, 404);
    const worldRow = await readableWorld(row.worldId, user.id);
    if (worldRow === null) return context.json({ error: "World not found." }, 404);
    const override = portraitSchema.safeParse(await context.req.json().catch(() => null));
    const unsaved = override.success ? override.data : {};
    await enqueuePortrait(
      toWorld(worldRow),
      toCharacter({
        ...row,
        name: unsaved.name ?? row.name,
        pronouns: unsaved.pronouns ?? row.pronouns,
        bio: unsaved.bio ?? row.bio,
        appearance: unsaved.appearance ?? row.appearance,
        outfit: unsaved.outfit ?? row.outfit,
      }),
      unsaved.prompt,
      true,
    );
    return context.json({ status: "queued" }, 202);
  });
