import { ASSET_CHANNEL } from "@chronicle/config";
import { db, schema } from "@chronicle/db";
import { type AudioReady, assetReadySchema } from "@chronicle/utils";
import { eq } from "drizzle-orm";
import type { Redis } from "ioredis";
import { createRedis } from "~/queue";

let listener: Redis | null = null;

function versioned(imageUrl: string): string {
  return `${imageUrl.split("?")[0]}?v=${Date.now()}`;
}

async function persist(raw: string): Promise<void> {
  const asset = assetReadySchema.parse(JSON.parse(raw));

  if (asset.kind === "cover") {
    await db
      .update(schema.worlds)
      .set({ coverImageUrl: versioned(asset.imageUrl) })
      .where(eq(schema.worlds.id, asset.worldId));
    return;
  }

  if (asset.kind === "portrait") {
    await db
      .update(schema.characters)
      .set({ portraitUrl: versioned(asset.imageUrl) })
      .where(eq(schema.characters.id, asset.characterId));
    return;
  }

  await db
    .update(schema.turns)
    .set({ sceneImageUrl: asset.imageUrl })
    .where(eq(schema.turns.id, asset.turnId));
}

export async function recordSentenceAudio(audio: AudioReady): Promise<void> {
  const row = await db
    .select({ audioUrlsJson: schema.turns.audioUrlsJson })
    .from(schema.turns)
    .where(eq(schema.turns.id, audio.turnId))
    .get();
  if (row === undefined) return;

  const kept = (row.audioUrlsJson ?? []).filter(
    (entry) => entry.sentenceIndex !== audio.sentenceIndex,
  );
  const audioUrls = [
    ...kept,
    { sentenceIndex: audio.sentenceIndex, audioUrl: audio.audioUrl },
  ].sort((left, right) => left.sentenceIndex - right.sentenceIndex);

  await db
    .update(schema.turns)
    .set({ audioUrlsJson: audioUrls })
    .where(eq(schema.turns.id, audio.turnId));
}

export function startAssetWriter(): void {
  if (listener !== null) return;
  listener = createRedis();
  void listener.subscribe(ASSET_CHANNEL);
  listener.on("message", (channel: string, raw: string) => {
    if (channel !== ASSET_CHANNEL) return;
    persist(raw).catch((error: unknown) => {
      console.error("[director] could not record a rendered asset:", error);
    });
  });
}
