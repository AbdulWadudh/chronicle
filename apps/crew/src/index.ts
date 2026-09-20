import {
  QUEUE_DIFFUSION,
  QUEUE_MEMORY,
  QUEUE_PREFIX,
  QUEUE_TTS,
  SETTINGS_CHANNEL,
} from "@chronicle/config";
import { invalidateSettings } from "@chronicle/db";
import { Worker } from "bullmq";
import { renderImage } from "~/processors/diffusion";
import { rememberEpisode } from "~/processors/memory";
import { synthesize } from "~/processors/tts";
import { connection, disconnectRedis, subscriber } from "~/redis";

const DIFFUSION_CONCURRENCY = 1;
const TTS_CONCURRENCY = 3;
const MEMORY_CONCURRENCY = 2;

const shared = { connection: connection(), prefix: QUEUE_PREFIX };

const workers = [
  new Worker(QUEUE_DIFFUSION, renderImage, { ...shared, concurrency: DIFFUSION_CONCURRENCY }),
  new Worker(QUEUE_TTS, synthesize, { ...shared, concurrency: TTS_CONCURRENCY }),
  new Worker(QUEUE_MEMORY, rememberEpisode, { ...shared, concurrency: MEMORY_CONCURRENCY }),
];

for (const worker of workers) {
  worker.on("failed", (job, error) => {
    console.error(`[crew] ${worker.name} job ${job?.id ?? "unknown"} failed:`, error.message);
  });
}

const settingsWatcher = subscriber();
await settingsWatcher.subscribe(SETTINGS_CHANNEL);
settingsWatcher.on("message", (channel) => {
  if (channel !== SETTINGS_CHANNEL) return;
  invalidateSettings();
  console.log("[crew] runtime settings invalidated");
});

async function shutdown(): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
  await disconnectRedis();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

console.log(`[crew] workers online: ${workers.map((worker) => worker.name).join(", ")}`);
