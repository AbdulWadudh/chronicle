import {
  DEFAULT_DIRECTOR_HOST,
  DEFAULT_DIRECTOR_PORT,
  directorUrl,
  MIN_AUTH_SECRET_LENGTH,
} from "@chronicle/shared";
import { z } from "zod";
import { defaultDatabasePath, defaultVectorDatabasePath } from "./paths";

export const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DIRECTOR_PORT: z.coerce.number().int().positive().default(DEFAULT_DIRECTOR_PORT),
  STORAGE_ENDPOINT: z.url(),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_BUCKET_ASSETS: z.string().min(1),
  STORAGE_REGION: z.string().min(1).default("auto"),
  DATABASE_PATH: z.string().min(1).default(defaultDatabasePath()),
  VECTOR_DB_PATH: z.string().min(1).default(defaultVectorDatabasePath()),
  REDIS_URL: z.url(),
  LLM_ENDPOINT: z.url(),
  LLM_MODEL: z.string().min(1).default("local"),
  DIFFUSION_ENDPOINT: z.url(),
  TTS_ENDPOINT: z.url(),
  AUTH_SECRET: z.string().min(MIN_AUTH_SECRET_LENGTH),
  AUTH_BASE_URL: z.url().default(directorUrl(DEFAULT_DIRECTOR_HOST, DEFAULT_DIRECTOR_PORT)),

  WS_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(120),
});

export type Environment = z.infer<typeof environmentSchema>;

let cached: Environment | null = null;

export type EnvironmentSource = Record<string, string | undefined>;

export function loadEnvironment(source: EnvironmentSource = process.env): Environment {
  const parsed = environmentSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid Chronicle environment.\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export function env(): Environment {
  if (cached === null) cached = loadEnvironment();
  return cached;
}

export function resetEnvironmentCache(): void {
  cached = null;
}
