import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { env } from "@chronicle/config";
import { API } from "@chronicle/shared";
import { betterAuth } from "better-auth";
import type { ChronicleDatabase } from "./client";
import * as schema from "./schema";

export const AUTH_BASE_PATH = API.auth;

export function createAuth(db: ChronicleDatabase) {
  const configuration = env();
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
      usePlural: true,
    }),
    basePath: AUTH_BASE_PATH,
    baseURL: configuration.AUTH_BASE_URL,
    secret: configuration.AUTH_SECRET,
    emailAndPassword: { enabled: true },
    advanced: {
      database: { generateId: () => Bun.randomUUIDv7() },
    },
  });
}

export type ChronicleAuth = ReturnType<typeof createAuth>;
