import { MEMORY_CHANNEL } from "@chronicle/config";
import { db, schema } from "@chronicle/db";
import { type MemoryReady, memoryReadySchema, type StatePatch } from "@chronicle/utils";
import { eq } from "drizzle-orm";
import type { Redis } from "ioredis";
import { createRedis } from "~/queue";

let listener: Redis | null = null;
const earlySummaries = new Map<string, MemoryReady>();

export function withSummary(patch: StatePatch | null, ready: MemoryReady): StatePatch {
  return {
    ...patch,
    summary: ready.summary,
    factsAdded: [...(patch?.factsAdded ?? []), ...ready.factsAdded],
  };
}

export function takeEarlySummary(turnId: string, patch: StatePatch | null): StatePatch | null {
  const ready = earlySummaries.get(turnId);
  if (ready === undefined) return patch;
  earlySummaries.delete(turnId);
  return withSummary(patch, ready);
}

async function persist(raw: string): Promise<void> {
  const ready = memoryReadySchema.parse(JSON.parse(raw));
  const row = await db
    .select({ stateDiffJson: schema.turns.stateDiffJson })
    .from(schema.turns)
    .where(eq(schema.turns.id, ready.turnId))
    .get();
  if (row === undefined) {
    earlySummaries.set(ready.turnId, ready);
    return;
  }

  await db
    .update(schema.turns)
    .set({ stateDiffJson: withSummary(row.stateDiffJson, ready) })
    .where(eq(schema.turns.id, ready.turnId));
}

export function startMemoryWriter(): void {
  if (listener !== null) return;
  listener = createRedis();
  void listener.subscribe(MEMORY_CHANNEL);
  listener.on("message", (channel: string, raw: string) => {
    if (channel !== MEMORY_CHANNEL) return;
    persist(raw).catch((error: unknown) => {
      console.error("[director] could not record a story summary:", error);
    });
  });
}
