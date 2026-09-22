import { ENSEMBLE, STATS } from "@chronicle/config";
import { db, schema, toWorld } from "@chronicle/db";
import {
  renderStyleSchema,
  shotSizeSchema,
  statDefinitionSchema,
  worldStateSchema,
} from "@chronicle/utils";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { type AuthEnv, requireSession } from "~/auth";
import { populateCast } from "~/casting";
import { draftWorld } from "~/engine/authoring";
import { enqueueCover } from "~/engine/imagery";
import { voiceRejection } from "~/engine/voices";
import { paletteOverridesSchema } from "~/themeTokens";

const createWorldSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  genre: z.string().default(""),
  visualStyle: z.string().max(600).default(""),
  shotSize: shotSizeSchema.default("waistUp"),
  artStyle: renderStyleSchema.default("photoreal"),
  themeOverrides: paletteOverridesSchema.nullable().default(null),
  coverImageUrl: z.string().nullable().default(null),
  visibility: z.enum(["private", "public"]).default("private"),
  narratorPrompt: z.string().max(ENSEMBLE.narratorPromptMaxChars).default(""),
  narratorVoiceId: z.string().min(1).nullable().default(null),
  ensembleEnabled: z.boolean().default(false),
  statDefinitions: z.array(statDefinitionSchema).min(1),
  pointBudget: z.number().int().positive().default(STATS.defaultPointBudget),
  initialState: worldStateSchema,
});

const patchWorldSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  genre: z.string().optional(),
  visualStyle: z.string().max(600).optional(),
  shotSize: shotSizeSchema.optional(),
  artStyle: renderStyleSchema.optional(),
  themeOverrides: paletteOverridesSchema.nullable().optional(),
  visibility: z.enum(["private", "public"]).optional(),
  narratorPrompt: z.string().max(ENSEMBLE.narratorPromptMaxChars).optional(),
  narratorVoiceId: z.string().min(1).nullable().optional(),
  ensembleEnabled: z.boolean().optional(),
});

const coverSchema = z.object({ prompt: z.string().min(1).max(600).optional() });

const assistSchema = z.object({ premise: z.string().min(8).max(600) });

const listQuerySchema = z.object({
  scope: z.enum(["mine", "community"]).default("mine"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const worldRoutes = new Hono<AuthEnv>()
  .use("*", requireSession)
  .get("/", async (context) => {
    const query = listQuerySchema.safeParse(
      Object.fromEntries(new URL(context.req.url).searchParams),
    );
    if (!query.success) return context.json({ error: "Invalid query." }, 400);

    const user = context.get("user");
    const filter =
      query.data.scope === "community"
        ? eq(schema.worlds.visibility, "public")
        : eq(schema.worlds.userId, user.id);

    const rows = await db
      .select()
      .from(schema.worlds)
      .where(filter)
      .orderBy(desc(schema.worlds.createdAt))
      .limit(query.data.limit + 1)
      .all();

    const hasMore = rows.length > query.data.limit;
    const items = hasMore ? rows.slice(0, query.data.limit) : rows;
    return context.json({ items, nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null });
  })
  .post("/assist", async (context) => {
    const body = assistSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) return context.json({ error: "Describe the world in a sentence." }, 400);
    try {
      const draft = await draftWorld(body.data.premise);
      if (draft.statDefinitions.length === 0) {
        return context.json({ error: "The game master proposed no usable abilities." }, 502);
      }
      return context.json(draft);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "The game master did not answer.";
      return context.json({ error: reason }, 502);
    }
  })
  .post("/", async (context) => {
    const body = createWorldSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) return context.json({ error: "Invalid world." }, 400);

    const rejectedVoice = await voiceRejection(body.data.narratorVoiceId);
    if (rejectedVoice !== null) return context.json({ error: rejectedVoice }, 400);

    const user = context.get("user");
    const [row] = await db
      .insert(schema.worlds)
      .values({
        userId: user.id,
        title: body.data.title,
        description: body.data.description,
        coverImageUrl: body.data.coverImageUrl,
        genre: body.data.genre,
        visualStyle: body.data.visualStyle,
        shotSize: body.data.shotSize,
        artStyle: body.data.artStyle,
        themeOverridesJson: body.data.themeOverrides,
        visibility: body.data.visibility,
        narratorPrompt: body.data.narratorPrompt,
        narratorVoiceId: body.data.narratorVoiceId,
        ensembleEnabled: body.data.ensembleEnabled,
        statDefinitionsJson: body.data.statDefinitions,
        pointBudget: body.data.pointBudget,
        initialStateJson: body.data.initialState,
      })
      .returning();
    if (row === undefined) return context.json({ error: "The world was not written." }, 500);

    const world = toWorld(row);
    if (row.coverImageUrl === null) await enqueueCover(world);
    populateCast(world);
    return context.json(row, 201);
  })
  .patch("/:id", async (context) => {
    const body = patchWorldSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) return context.json({ error: "Invalid world." }, 400);

    const user = context.get("user");
    const row = await db
      .select()
      .from(schema.worlds)
      .where(and(eq(schema.worlds.id, context.req.param("id")), eq(schema.worlds.userId, user.id)))
      .get();
    if (row === undefined) return context.json({ error: "Not found." }, 404);

    const rejectedVoice = await voiceRejection(body.data.narratorVoiceId);
    if (rejectedVoice !== null) return context.json({ error: rejectedVoice }, 400);

    const [updated] = await db
      .update(schema.worlds)
      .set({
        title: body.data.title ?? row.title,
        description: body.data.description ?? row.description,
        genre: body.data.genre ?? row.genre,
        visualStyle: body.data.visualStyle ?? row.visualStyle,
        shotSize: body.data.shotSize ?? row.shotSize,
        artStyle: body.data.artStyle ?? row.artStyle,
        themeOverridesJson:
          body.data.themeOverrides === undefined
            ? row.themeOverridesJson
            : body.data.themeOverrides,
        visibility: body.data.visibility ?? row.visibility,
        narratorPrompt: body.data.narratorPrompt ?? row.narratorPrompt,
        narratorVoiceId:
          body.data.narratorVoiceId === undefined ? row.narratorVoiceId : body.data.narratorVoiceId,
        ensembleEnabled: body.data.ensembleEnabled ?? row.ensembleEnabled,
      })
      .where(eq(schema.worlds.id, row.id))
      .returning();
    if (updated === undefined) return context.json({ error: "The change was not saved." }, 500);
    return context.json(updated);
  })
  .get("/:id", async (context) => {
    const user = context.get("user");
    const row = await db
      .select()
      .from(schema.worlds)
      .where(eq(schema.worlds.id, context.req.param("id")))
      .get();
    if (row === undefined) return context.json({ error: "Not found." }, 404);
    if (row.visibility === "private" && row.userId !== user.id) {
      return context.json({ error: "Not found." }, 404);
    }
    return context.json(row);
  })
  .post("/:id/cover", async (context) => {
    const user = context.get("user");
    const row = await db
      .select()
      .from(schema.worlds)
      .where(and(eq(schema.worlds.id, context.req.param("id")), eq(schema.worlds.userId, user.id)))
      .get();
    if (row === undefined) return context.json({ error: "Not found." }, 404);
    const override = coverSchema.safeParse(await context.req.json().catch(() => null));
    await enqueueCover(toWorld(row), override.success ? override.data.prompt : undefined);
    return context.json({ status: "queued" }, 202);
  })
  .delete("/:id", async (context) => {
    const user = context.get("user");
    await db
      .delete(schema.worlds)
      .where(and(eq(schema.worlds.id, context.req.param("id")), eq(schema.worlds.userId, user.id)));
    return context.body(null, 204);
  });
