import { Database } from "bun:sqlite";
import { env } from "@chronicle/config/env";
import { ensureFile } from "@chronicle/config/paths";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const PRAGMAS = [
  "PRAGMA journal_mode = WAL",
  "PRAGMA synchronous = NORMAL",
  "PRAGMA foreign_keys = ON",
  "PRAGMA busy_timeout = 5000",
];

const path = env().DATABASE_PATH;
await ensureFile(path);

const sqlite = new Database(path, { create: true });
for (const pragma of PRAGMAS) sqlite.exec(pragma);

export const db = drizzle(sqlite, { schema });

export type ChronicleDatabase = typeof db;
