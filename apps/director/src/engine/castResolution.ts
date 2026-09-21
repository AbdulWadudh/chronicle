import { type ChronicleDatabase, schema, toCharacter } from "@chronicle/db";
import { type Character, pronounPhrase } from "@chronicle/utils";
import { and, eq, ne } from "drizzle-orm";

export async function resolveInteractingCharacters(
  database: ChronicleDatabase,
  worldId: string,
  protagonistId: string,
  action: string,
  mentionedIds?: readonly string[],
): Promise<Character[]> {
  const rows = await database
    .select()
    .from(schema.characters)
    .where(and(eq(schema.characters.worldId, worldId), ne(schema.characters.id, protagonistId)))
    .all();

  if (rows.length === 0) return [];

  const explicitIds = new Set(mentionedIds ?? []);
  const normalizedAction = action.toLowerCase();
  const mentionMatches = Array.from(action.matchAll(/@([a-zA-Z0-9_ ]+)/gu))
    .map((match) => match[1]?.trim().toLowerCase() ?? "")
    .filter((name) => name.length > 0);

  const matched = rows.filter((row) => {
    if (explicitIds.has(row.id)) return true;
    const lowerName = row.name.toLowerCase();
    if (mentionMatches.some((name) => lowerName.includes(name) || name.includes(lowerName))) {
      return true;
    }
    return normalizedAction.includes(lowerName);
  });

  return matched.map((row) => toCharacter(row));
}

export async function summarizeWorldCast(
  database: ChronicleDatabase,
  worldId: string,
  protagonistId: string,
): Promise<string | null> {
  const rows = await database
    .select({ name: schema.characters.name, bio: schema.characters.bio })
    .from(schema.characters)
    .where(and(eq(schema.characters.worldId, worldId), ne(schema.characters.id, protagonistId)))
    .all();

  if (rows.length === 0) return null;

  const entries = rows.map((row) => {
    const roleMatch = /^([^.,]+)/u.exec(row.bio.trim());
    const roleText = roleMatch?.[1]?.trim();
    const shortRole =
      roleText !== undefined && roleText.length > 0 ? roleText : row.bio.slice(0, 40).trim();
    return shortRole.length > 0 ? `${row.name} (${shortRole})` : row.name;
  });

  return `Known inhabitants in this world: ${entries.join("; ")}.`;
}

export async function lookupCharacterByName(
  database: ChronicleDatabase,
  worldId: string,
  nameQuery: string,
): Promise<string | null> {
  const query = nameQuery.trim().toLowerCase();
  if (query.length === 0) return null;

  const rows = await database
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.worldId, worldId))
    .all();

  const found = rows.find((row) => row.name.toLowerCase().includes(query));
  if (found === undefined) return null;

  const char = toCharacter(found);
  return `${char.name} (${pronounPhrase(char.pronouns)}). ${char.bio}`;
}
