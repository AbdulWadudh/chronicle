import type {
  DiceCheck,
  SentenceAudio,
  StatePatch,
  TurnChoice,
  WorldState,
} from "@chronicle/utils";
import {
  type AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { characters, worlds } from "./world";

export const turns = sqliteTable(
  "turns",
  {
    id: text("id").primaryKey().$defaultFn(Bun.randomUUIDv7),
    parentId: text("parent_id").references((): AnySQLiteColumn => turns.id, {
      onDelete: "cascade",
    }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    playerAction: text("player_action").notNull(),
    narrativeText: text("narrative_text").notNull(),
    choicesJson: text("choices_json", { mode: "json" }).$type<TurnChoice[]>().notNull(),
    sceneImageUrl: text("scene_image_url"),
    audioUrlsJson: text("audio_urls_json", { mode: "json" }).$type<SentenceAudio[]>(),
    stateDiffJson: text("state_diff_json", { mode: "json" }).$type<StatePatch>(),
    diceCheckJson: text("dice_check_json", { mode: "json" }).$type<DiceCheck>(),
    branchIndex: integer("branch_index").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("turns_parent_idx").on(table.parentId),
    index("turns_character_idx").on(table.characterId, table.createdAt),
    uniqueIndex("turns_sibling_idx").on(table.parentId, table.branchIndex),
  ],
);

export const checkpoints = sqliteTable(
  "checkpoints",
  {
    id: text("id").primaryKey().$defaultFn(Bun.randomUUIDv7),
    turnId: text("turn_id")
      .notNull()
      .references(() => turns.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    worldId: text("world_id")
      .notNull()
      .references(() => worlds.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    snapshotJson: text("snapshot_json", { mode: "json" }).$type<WorldState>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("checkpoints_character_idx").on(table.characterId, table.createdAt)],
);
