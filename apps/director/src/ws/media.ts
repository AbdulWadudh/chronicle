import { audioReadySchema, imageReadySchema, PROTOCOL_VERSION } from "@chronicle/utils";
import type { Redis } from "ioredis";
import { createRedis } from "~/queue";
import { type ChronicleSocket, send } from "~/ws/session";

const AUDIO_PATTERN = "stream:audio:*";
const IMAGE_PATTERN = "stream:image:*";

const owners = new Map<string, ChronicleSocket>();

let subscriber: Redis | null = null;

export function ownTurn(turnId: string, socket: ChronicleSocket): void {
  owners.set(turnId, socket);
}

export function disownSocket(socket: ChronicleSocket): void {
  for (const [turnId, owner] of owners) {
    if (owner === socket) owners.delete(turnId);
  }
}

export function startMediaRelay(): void {
  if (subscriber !== null) return;
  subscriber = createRedis();
  void subscriber.psubscribe(AUDIO_PATTERN, IMAGE_PATTERN);
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

  if (pattern === IMAGE_PATTERN) {
    const image = imageReadySchema.parse(payload);
    const socket = owners.get(image.turnId);
    if (socket === undefined) return;
    send(socket, {
      v: PROTOCOL_VERSION,
      replyTo: null,
      type: "SCENE_IMAGE_READY",
      turnId: image.turnId,
      imageUrl: image.imageUrl,
    });
    return;
  }

  const audio = audioReadySchema.parse(payload);
  const socket = owners.get(audio.turnId);
  if (socket === undefined) return;
  send(socket, {
    v: PROTOCOL_VERSION,
    replyTo: null,
    type: "SENTENCE_AUDIO_READY",
    turnId: audio.turnId,
    sentenceIndex: audio.sentenceIndex,
    audioUrl: audio.audioUrl,
  });
}
