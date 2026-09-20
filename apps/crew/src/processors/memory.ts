import { env } from "@chronicle/config/env";
import { type MemoryJob, memoryJobSchema, splitIntoSentences } from "@chronicle/utils";
import { type Connection, connect, type Table } from "@lancedb/lancedb";
import type { Job } from "bullmq";

const TABLE_NAME = "episodes";
const EMBEDDING_DIMENSIONS = 384;

let connectionPromise: Promise<Connection> | null = null;

async function vectorStore(): Promise<Connection> {
  connectionPromise ??= connect(env().VECTOR_DB_PATH);
  return connectionPromise;
}

export function embed(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  for (let index = 0; index < text.length; index += 1) {
    const slot = text.charCodeAt(index) % EMBEDDING_DIMENSIONS;
    vector[slot] = (vector[slot] ?? 0) + 1;
  }
  const magnitude = Math.hypot(...vector) || 1;
  return vector.map((value) => value / magnitude);
}

type EpisodeRow = Record<string, unknown>;

async function openTable(rows: EpisodeRow[]): Promise<Table> {
  const store = await vectorStore();
  const names = await store.tableNames();
  if (!names.includes(TABLE_NAME)) return store.createTable(TABLE_NAME, rows);
  return store.openTable(TABLE_NAME);
}

export async function rememberEpisode(job: Job<MemoryJob>): Promise<number> {
  const payload = memoryJobSchema.parse(job.data);
  const rows = splitIntoSentences(payload.narrativeText).map((text) => ({
    turnId: payload.turnId,
    characterId: payload.characterId,
    worldId: payload.worldId,
    text,
    vector: embed(text),
  }));
  if (rows.length === 0) return 0;

  const table = await openTable(rows);
  const existing = await table.countRows();
  if (existing > 0) await table.add(rows);
  return rows.length;
}

export async function recallEpisodes(
  characterId: string,
  query: string,
  limit: number,
): Promise<string[]> {
  const store = await vectorStore();
  const names = await store.tableNames();
  if (!names.includes(TABLE_NAME)) return [];
  const table = await store.openTable(TABLE_NAME);
  const results = await table
    .search(embed(query))
    .where(`characterId = '${characterId.replace(/'/gu, "")}'`)
    .limit(limit)
    .toArray();
  return results.map((row) => String((row as { text?: unknown }).text ?? ""));
}
