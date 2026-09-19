import { database, newId, schema } from "@chronicle/db";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_POINT_BUDGET,
  MAX_PAGE_SIZE,
  statDefinitionSchema,
  worldStateSchema,
} from "@chronicle/shared";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AuthEnv } from "../auth";

const createWorldSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  genre: z.string().default(""),
  coverImageUrl: z.string().nullable().default(null),
  visibility: z.enum(["private", "public"]).default("private"),
  statDefinitions: z.array(statDefinitionSchema).min(1),
  pointBudget: z.number().int().positive().default(DEFAULT_POINT_BUDGET),
  initialState: worldStateSchema,
});

const listQuerySchema = z.object({
  scope: z.enum(["mine", "community"]).default("mine"),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  cursor: z.string().optional(),
});

export const worldRoutes = new Hono<AuthEnv>()
  .get("/", async (context) => {
    const query = listQuerySchema.safeParse(
      Object.fromEntries(new URL(context.req.url).searchParams),
    );
    if (!query.success) return context.json({ error: "Invalid query." }, 400);

    const db = await database();
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
  .post("/", async (context) => {
    const body = createWorldSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) return context.json({ error: "Invalid world." }, 400);

    const db = await database();
    const user = context.get("user");
    const world = {
      id: newId(),
      userId: user.id,
      title: body.data.title,
      description: body.data.description,
      coverImageUrl: body.data.coverImageUrl,
      genre: body.data.genre,
      visibility: body.data.visibility,
      statDefinitionsJson: body.data.statDefinitions,
      pointBudget: body.data.pointBudget,
      initialStateJson: body.data.initialState,
      createdAt: new Date(),
    };
    await db.insert(schema.worlds).values(world);
    return context.json(world, 201);
  })
  .get("/:id", async (context) => {
    const db = await database();
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
  .delete("/:id", async (context) => {
    const db = await database();
    const user = context.get("user");
    await db
      .delete(schema.worlds)
      .where(and(eq(schema.worlds.id, context.req.param("id")), eq(schema.worlds.userId, user.id)));
    return context.body(null, 204);
  });
