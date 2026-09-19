import { defaultDatabasePath } from "@chronicle/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dbCredentials: { url: process.env.DATABASE_PATH ?? defaultDatabasePath() },
  strict: true,
  verbose: true,
});
