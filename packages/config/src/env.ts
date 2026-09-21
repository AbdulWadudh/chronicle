import { z } from "zod";
import { defaultDatabasePath, defaultVectorDatabasePath } from "./paths";
import { BASE_URL, DIRECTOR } from "./routes";

const endpoint = z.url().transform((value) => value.replace(/\/+$/u, ""));

export const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DIRECTOR_PORT: z.coerce.number().int().positive().default(DIRECTOR.defaultPort),
  STORAGE_ENDPOINT: endpoint,
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_BUCKET_ASSETS: z.string().min(1),
  STORAGE_REGION: z.string().min(1).default("auto"),
  DATABASE_PATH: z.string().min(1).default(defaultDatabasePath()),
  VECTOR_DB_PATH: z.string().min(1).default(defaultVectorDatabasePath()),
  STAGE_DIST: z.string().min(1).optional(),
  REDIS_URL: z.url(),
  LLM_ENDPOINT: endpoint,
  LLM_MODEL: z.string().min(1).default("local"),
  DIFFUSION_ENDPOINT: endpoint,
  TTS_ENDPOINT: endpoint,
  AUTH_SECRET: z.string().min(32),
  AUTH_BASE_URL: endpoint.default(BASE_URL),
  AUTH_TRUSTED_ORIGINS: z
    .string()
    .default("*")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

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
