import type { RuntimeSettings } from "@chronicle/shared";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  valueJson: text("value_json", { mode: "json" }).$type<RuntimeSettings>().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  updatedBy: text("updated_by"),
});
