import { STATS } from "@chronicle/config";
import type { Inventory, StatBlock, StatDefinition, WorldState } from "@chronicle/utils";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./auth";

export const worlds = sqliteTable(
  "worlds",
  {
    id: text("id").primaryKey().$defaultFn(Bun.randomUUIDv7),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    coverImageUrl: text("cover_image_url"),
    genre: text("genre").notNull().default(""),
    visibility: text("visibility", { enum: ["private", "public"] })
      .notNull()
      .default("private"),
    statDefinitionsJson: text("stat_definitions_json", { mode: "json" })
      .$type<StatDefinition[]>()
      .notNull(),
    pointBudget: integer("point_budget").notNull().default(STATS.defaultPointBudget),
    initialStateJson: text("initial_state_json", { mode: "json" }).$type<WorldState>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("worlds_user_idx").on(table.userId),
    index("worlds_visibility_idx").on(table.visibility, table.createdAt),
  ],
);

export const characters = sqliteTable(
  "characters",
  {
    id: text("id").primaryKey().$defaultFn(Bun.randomUUIDv7),
    worldId: text("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    bio: text("bio").notNull().default(""),
    pronouns: text("pronouns", { enum: ["he", "she", "they"] })
      .notNull()
      .default("they"),
    portraitUrl: text("portrait_url"),
    statsJson: text("stats_json", { mode: "json" }).$type<StatBlock>().notNull(),
    inventoryJson: text("inventory_json", { mode: "json" }).$type<Inventory>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("characters_world_idx").on(table.worldId),
    index("characters_user_idx").on(table.userId),
  ],
);
