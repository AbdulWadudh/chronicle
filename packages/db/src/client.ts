import { Database } from "bun:sqlite";
import { ensureFile, env } from "@chronicle/config";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const PRAGMAS = [
  "PRAGMA journal_mode = WAL",
  "PRAGMA synchronous = NORMAL",
  "PRAGMA foreign_keys = ON",
  "PRAGMA busy_timeout = 5000",
];

export type ChronicleDatabase = ReturnType<typeof drizzle<typeof schema>>;

export function openSqlite(path: string): Database {
  const sqlite = new Database(path, { create: true });
  for (const pragma of PRAGMAS) sqlite.exec(pragma);
  return sqlite;
}

export async function createDatabase(path?: string): Promise<ChronicleDatabase> {
  const target = path ?? env().DATABASE_PATH;
  await ensureFile(target);
  return drizzle(openSqlite(target), { schema });
}

let cached: ChronicleDatabase | null = null;

export async function database(): Promise<ChronicleDatabase> {
  if (cached === null) cached = await createDatabase();
  return cached;
}

export function newId(): string {
  return Bun.randomUUIDv7();
}
