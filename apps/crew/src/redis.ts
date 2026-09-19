import { env } from "@chronicle/config";
import { Redis } from "ioredis";

let connectionInstance: Redis | null = null;
let publisherInstance: Redis | null = null;
let subscriberInstance: Redis | null = null;

function create(): Redis {
  return new Redis(env().REDIS_URL, { maxRetriesPerRequest: null });
}

export function connection(): Redis {
  connectionInstance ??= create();
  return connectionInstance;
}

export function publisher(): Redis {
  publisherInstance ??= create();
  return publisherInstance;
}

export function subscriber(): Redis {
  subscriberInstance ??= create();
  return subscriberInstance;
}

export async function disconnectRedis(): Promise<void> {
  for (const instance of [connectionInstance, publisherInstance, subscriberInstance]) {
    instance?.disconnect();
  }
  connectionInstance = null;
  publisherInstance = null;
  subscriberInstance = null;
}
