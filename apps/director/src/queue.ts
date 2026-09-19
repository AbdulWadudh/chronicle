import { env } from "@chronicle/config";
import {
  type DiffusionJob,
  type MemoryJob,
  QUEUE_DIFFUSION,
  QUEUE_MEMORY,
  QUEUE_TTS,
  SETTINGS_CHANNEL,
  type TtsJob,
} from "@chronicle/shared";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

export function createRedis(): Redis {
  return new Redis(env().REDIS_URL, { maxRetriesPerRequest: null });
}

const connection = createRedis();

export const diffusionQueue = new Queue<DiffusionJob>(QUEUE_DIFFUSION, { connection });
export const ttsQueue = new Queue<TtsJob>(QUEUE_TTS, { connection });
export const memoryQueue = new Queue<MemoryJob>(QUEUE_MEMORY, { connection });

export async function closeQueues(): Promise<void> {
  await Promise.all([diffusionQueue.close(), ttsQueue.close(), memoryQueue.close()]);
  connection.disconnect();
}

export async function publishSettingsChange(): Promise<void> {
  await connection.publish(SETTINGS_CHANNEL, String(Date.now()));
}
