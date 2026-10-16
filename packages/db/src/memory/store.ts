import { MEMORY } from "@chronicle/config";
import { env } from "@chronicle/config/env";
import { type Connection, connect, type Table } from "@lancedb/lancedb";
import { z } from "zod";

export interface Episode {
  turnId: string;
  worldId: string;
  characterId: string;
  text: string;
  createdAt: number;
}

const recalledRowSchema = z.object({ turnId: z.string(), text: z.string() });

let connectionPromise: Promise<Connection> | null = null;

function store(): Promise<Connection> {
  connectionPromise ??= connect(env().VECTOR_DB_PATH);
  return connectionPromise;
}

async function vectorWidth(table: Table): Promise<number | null> {
  const field = (await table.schema()).fields.find((entry) => entry.name === "vector");
  const type = field?.type as { listSize?: number } | undefined;
  return type?.listSize ?? null;
}

async function openEpisodes(connection: Connection): Promise<Table | null> {
  const names = await connection.tableNames();
  if (!names.includes(MEMORY.table)) return null;
  const table = await connection.openTable(MEMORY.table);
  if ((await vectorWidth(table)) === MEMORY.dimensions) return table;
  await connection.dropTable(MEMORY.table);
  return null;
}

export async function rememberEpisode(episode: Episode, vector: number[]): Promise<void> {
  const connection = await store();
  const row = { ...episode, vector };
  const table = await openEpisodes(connection);
  if (table === null) {
    await connection.createTable(MEMORY.table, [row]);
    return;
  }
  await table.delete(`turnId = ${quoted([episode.turnId])}`);
  await table.add([row]);
}

function quoted(values: readonly string[]): string {
  return values.map((value) => `'${value.replaceAll("'", "''")}'`).join(", ");
}

export async function recallEpisodes(
  turnIds: readonly string[],
  vector: number[],
  limit: number,
): Promise<{ turnId: string; text: string }[]> {
  if (turnIds.length === 0 || limit === 0) return [];
  const table = await openEpisodes(await store());
  if (table === null) return [];
  const rows = await table
    .search(vector)
    .where(`turnId IN (${quoted(turnIds)})`)
    .select(["turnId", "text"])
    .limit(limit)
    .toArray();
  return rows.map((row) => recalledRowSchema.parse(row));
}
