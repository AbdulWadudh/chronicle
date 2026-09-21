import { ASSET_CHANNEL } from "@chronicle/config";
import { db, schema } from "@chronicle/db";
import { type AudioReady, assetReadySchema, type SentenceAudio } from "@chronicle/utils";
import { eq } from "drizzle-orm";
import type { Redis } from "ioredis";
import { createRedis } from "~/queue";

let listener: Redis | null = null;
let audioWrites: Promise<void> = Promise.resolve();
const earlyAudio = new Map<string, SentenceAudio[]>();

function merge(existing: readonly SentenceAudio[], audio: AudioReady): SentenceAudio[] {
  return [
    ...existing.filter((entry) => entry.sentenceIndex !== audio.sentenceIndex),
    { sentenceIndex: audio.sentenceIndex, audioUrl: audio.audioUrl },
  ].sort((left, right) => left.sentenceIndex - right.sentenceIndex);
}

export function takeEarlyAudio(turnId: string): SentenceAudio[] {
  const kept = earlyAudio.get(turnId) ?? [];
  earlyAudio.delete(turnId);
  return kept;
}

export function versioned(url: string): string {
  return `${url.split("?")[0]}?v=${Date.now()}`;
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
    const url = versioned(asset.imageUrl);
    await db
      .update(schema.characters)
      .set(asset.draft ? { draftPortraitUrl: url } : { portraitUrl: url, draftPortraitUrl: null })
      .where(eq(schema.characters.id, asset.characterId));
    return;
  }

  await db
    .update(schema.turns)
    .set({ sceneImageUrl: asset.imageUrl })
    .where(eq(schema.turns.id, asset.turnId));
}

async function writeSentenceAudio(audio: AudioReady): Promise<void> {
  const row = await db
    .select({ audioUrlsJson: schema.turns.audioUrlsJson })
    .from(schema.turns)
    .where(eq(schema.turns.id, audio.turnId))
    .get();

  if (row === undefined) {
    earlyAudio.set(audio.turnId, merge(earlyAudio.get(audio.turnId) ?? [], audio));
    return;
  }

  await db
    .update(schema.turns)
    .set({ audioUrlsJson: merge(row.audioUrlsJson ?? [], audio) })
    .where(eq(schema.turns.id, audio.turnId));
}

export function recordSentenceAudio(audio: AudioReady): Promise<void> {
  audioWrites = audioWrites.then(() => writeSentenceAudio(audio));
  return audioWrites;
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
