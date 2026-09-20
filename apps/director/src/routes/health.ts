import { env } from "@chronicle/config/env";
import { db } from "@chronicle/db";
import type { AdminHealthReport, ServiceProbe } from "@chronicle/utils";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { Redis } from "ioredis";
import type { AuthEnv } from "~/auth";

const PROBE_TIMEOUT_MS = 3000;

interface ProbeSeed {
  id: string;
  name: string;
  detail: string;
}

function hostOf(raw: string): string {
  try {
    return new URL(raw).host;
  } catch {
    return raw;
  }
}

function describeError(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

function up(seed: ProbeSeed, latencyMs: number): ServiceProbe {
  return { ...seed, state: "up", latencyMs, error: null };
}

function down(seed: ProbeSeed, cause: unknown): ServiceProbe {
  return { ...seed, state: "down", latencyMs: null, error: describeError(cause) };
}

async function timed(run: () => Promise<unknown>): Promise<number> {
  const started = performance.now();
  await run();
  return Math.round(performance.now() - started);
}

async function probeHttp(seed: ProbeSeed, url: string): Promise<ServiceProbe> {
  try {
    const latencyMs = await timed(async () => {
      const response = await fetch(url, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    });
    return up(seed, latencyMs);
  } catch (cause) {
    return down(seed, cause);
  }
}

async function probeSqlite(seed: ProbeSeed): Promise<ServiceProbe> {
  try {
    const latencyMs = await timed(async () => {
      db.all(sql`SELECT 1`);
    });
    return up(seed, latencyMs);
  } catch (cause) {
    return down(seed, cause);
  }
}

async function probeRedis(seed: ProbeSeed): Promise<ServiceProbe> {
  const client = new Redis(env().REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    connectTimeout: PROBE_TIMEOUT_MS,
  });
  try {
    const latencyMs = await timed(() => client.ping());
    return up(seed, latencyMs);
  } catch (cause) {
    return down(seed, cause);
  } finally {
    client.disconnect();
  }
}

async function probeStorage(seed: ProbeSeed): Promise<ServiceProbe> {
  const configuration = env();
  const client = new Bun.S3Client({
    endpoint: configuration.STORAGE_ENDPOINT,
    accessKeyId: configuration.STORAGE_ACCESS_KEY,
    secretAccessKey: configuration.STORAGE_SECRET_KEY,
    bucket: configuration.STORAGE_BUCKET_ASSETS,
    region: configuration.STORAGE_REGION,
  });
  try {
    const latencyMs = await timed(() => client.list({ maxKeys: 1 }));
    return up(seed, latencyMs);
  } catch (cause) {
    return down(seed, cause);
  }
}

export const healthRoutes = new Hono<AuthEnv>().get("/", async (context) => {
  const configuration = env();

  const seeds = {
    llm: { id: "llm", name: "LLM", detail: hostOf(configuration.LLM_ENDPOINT) },
    diffusion: {
      id: "diffusion",
      name: "ComfyUI",
      detail: hostOf(configuration.DIFFUSION_ENDPOINT),
    },
    tts: { id: "tts", name: "Kokoro TTS", detail: hostOf(configuration.TTS_ENDPOINT) },
    sqlite: { id: "sqlite", name: "Database", detail: "SQLite" },
    redis: { id: "redis", name: "Dragonfly", detail: hostOf(configuration.REDIS_URL) },
    storage: { id: "storage", name: "RustFS", detail: hostOf(configuration.STORAGE_ENDPOINT) },
  } satisfies Record<string, ProbeSeed>;

  const services = await Promise.all([
    probeHttp(seeds.llm, `${configuration.LLM_ENDPOINT}/v1/models`),
    probeHttp(seeds.diffusion, `${configuration.DIFFUSION_ENDPOINT}/system_stats`),
    probeHttp(seeds.tts, `${configuration.TTS_ENDPOINT}/health`),
    probeSqlite(seeds.sqlite),
    probeRedis(seeds.redis),
    probeStorage(seeds.storage),
  ]);

  const upCount = services.filter((service) => service.state === "up").length;
  const report: AdminHealthReport = {
    checkedAt: new Date().toISOString(),
    overall: upCount === services.length ? "up" : "down",
    up: upCount,
    total: services.length,
    services,
  };
  return context.json(report);
});
