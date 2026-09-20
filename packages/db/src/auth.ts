import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { API } from "@chronicle/config";
import { env } from "@chronicle/config/env";
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { promoteFirstAccount } from "./accounts";
import type { ChronicleDatabase } from "./db";
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
    trustedOrigins: configuration.AUTH_TRUSTED_ORIGINS,
    plugins: [bearer()],
    databaseHooks: {
      user: {
        create: {
          after: async () => {
            await promoteFirstAccount();
          },
        },
      },
    },
    advanced: {
      database: { generateId: () => Bun.randomUUIDv7() },
    },
  });
}

export type ChronicleAuth = ReturnType<typeof createAuth>;
