import { invalidateSettings } from "@chronicle/db";
import { QUEUE_DIFFUSION, QUEUE_MEMORY, QUEUE_TTS, SETTINGS_CHANNEL } from "@chronicle/shared";
import { Worker } from "bullmq";
import { renderScene } from "~/processors/diffusion";
import { rememberEpisode } from "~/processors/memory";
import { synthesize } from "~/processors/tts";
import { connection, disconnectRedis, subscriber } from "~/redis";

const DIFFUSION_CONCURRENCY = 1;
const TTS_CONCURRENCY = 3;
const MEMORY_CONCURRENCY = 2;

const shared = { connection: connection() };

const workers = [
  new Worker(QUEUE_DIFFUSION, renderScene, { ...shared, concurrency: DIFFUSION_CONCURRENCY }),
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
