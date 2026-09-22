import {
  audioReadySchema,
  imageProgressSchema,
  imageReadySchema,
  PROTOCOL_VERSION,
} from "@chronicle/utils";
import type { Redis } from "ioredis";
import { recordSentenceAudio, versioned } from "~/assets";
import { createRedis } from "~/queue";
import { type ChronicleSocket, send, socketsFor } from "~/ws/session";

const AUDIO_PATTERN = "stream:audio:*";
const IMAGE_PATTERN = "stream:image:*";
const PROGRESS_PATTERN = "stream:progress:*";

interface TurnOwner {
  userId: string;
  characterId: string;
}

const owners = new Map<string, TurnOwner>();

let subscriber: Redis | null = null;

export function ownTurn(turnId: string, socket: ChronicleSocket): void {
  const { userId, characterId } = socket.data;
  if (characterId === null) return;
  owners.set(turnId, { userId, characterId });
}

export function ownTurnFor(turnId: string, userId: string, characterId: string): void {
  owners.set(turnId, { userId, characterId });
}

export function disownTurn(turnId: string): void {
  owners.delete(turnId);
}

function listenersFor(turnId: string): ChronicleSocket[] {
  const owner = owners.get(turnId);
  if (owner === undefined) return [];
  return socketsFor(owner.userId, owner.characterId);
}

export function startMediaRelay(): void {
  if (subscriber !== null) return;
  subscriber = createRedis();
  void subscriber.psubscribe(AUDIO_PATTERN, IMAGE_PATTERN, PROGRESS_PATTERN);
  subscriber.on("pmessage", (pattern: string, channel: string, raw: string) => {
    try {
      relay(pattern, raw);
    } catch (error) {
      console.error(`[director] media relay failed on ${channel}:`, error);
    }
  });
}

function relay(pattern: string, raw: string): void {
  const payload: unknown = JSON.parse(raw);

  if (pattern === PROGRESS_PATTERN) {
    const progress = imageProgressSchema.parse(payload);
    for (const socket of listenersFor(progress.turnId)) {
      send(socket, {
        v: PROTOCOL_VERSION,
        replyTo: null,
        type: "SCENE_PROGRESS",
        turnId: progress.turnId,
        value: progress.value,
        max: progress.max,
        stage: progress.stage,
        preview: progress.preview,
      });
    }
    return;
  }

  if (pattern === IMAGE_PATTERN) {
    const image = imageReadySchema.parse(payload);
    for (const socket of listenersFor(image.turnId)) {
      send(socket, {
        v: PROTOCOL_VERSION,
        replyTo: null,
        type: "SCENE_IMAGE_READY",
        turnId: image.turnId,
        imageUrl: image.imageUrl,
      });
    }
    return;
  }

  const parsed = audioReadySchema.parse(payload);
  const audio = { ...parsed, audioUrl: versioned(parsed.audioUrl) };
  recordSentenceAudio(audio).catch((error: unknown) => {
    console.error(`[director] could not record audio for ${audio.turnId}:`, error);
  });
  for (const socket of listenersFor(audio.turnId)) {
    send(socket, {
      v: PROTOCOL_VERSION,
      replyTo: null,
      type: "SENTENCE_AUDIO_READY",
      turnId: audio.turnId,
      sentenceIndex: audio.sentenceIndex,
      audioUrl: audio.audioUrl,
    });
  }
}
