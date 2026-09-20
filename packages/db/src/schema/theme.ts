import type { PaletteOverrides } from "@chronicle/utils";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const themePalettes = sqliteTable("theme_palettes", {
  id: text("id").primaryKey().$defaultFn(Bun.randomUUIDv7),
  name: text("name").notNull(),
  blurb: text("blurb").notNull(),
  overridesJson: text("overrides_json", { mode: "json" }).$type<PaletteOverrides>().notNull(),
  builtIn: integer("built_in", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
