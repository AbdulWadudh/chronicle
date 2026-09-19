import { join } from "node:path";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { createDatabase } from "./client";

const MIGRATIONS_FOLDER = join(import.meta.dir, "..", "migrations");

export async function runMigrations(): Promise<void> {
  const db = await createDatabase();
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

if (import.meta.main) {
  await runMigrations();
  console.log(`migrations applied from ${MIGRATIONS_FOLDER}`);
}
