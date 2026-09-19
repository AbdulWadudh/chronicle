import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { createDatabase } from "./client";

const MIGRATIONS_FOLDER = new URL("../migrations", import.meta.url).pathname;

export async function runMigrations(): Promise<void> {
  const db = await createDatabase();
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

if (import.meta.main) {
  await runMigrations();
  console.log("migrations applied");
}
