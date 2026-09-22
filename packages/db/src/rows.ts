import { type Character, characterSchema, type World, worldSchema } from "@chronicle/utils";
import type { schema } from ".";

export type WorldRow = typeof schema.worlds.$inferSelect;
export type CharacterRow = typeof schema.characters.$inferSelect;

export function toWorld(row: WorldRow): World {
  return worldSchema.parse({
    ...row,
    statDefinitions: row.statDefinitionsJson,
    initialState: row.initialStateJson,
    themeOverrides: row.themeOverridesJson,
  });
}

export function toCharacter(row: CharacterRow): Character {
  return characterSchema.parse({
    ...row,
    stats: row.statsJson,
    inventory: row.inventoryJson,
  });
}
