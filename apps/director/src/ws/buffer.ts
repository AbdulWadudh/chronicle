import { cachedSettings } from "@chronicle/db";
import type { ServerMessage } from "@chronicle/utils";

export interface BufferedTurn {
  turnId: string;
  messages: ServerMessage[];
  startedAt: number;
}

const buffers = new Map<string, BufferedTurn>();

export function openBuffer(turnId: string): BufferedTurn {
  const buffered: BufferedTurn = { turnId, messages: [], startedAt: Date.now() };
  buffers.set(turnId, buffered);
  evictOldest();
  return buffered;
}

export function record(turnId: string, message: ServerMessage): void {
  buffers.get(turnId)?.messages.push(message);
}

export function replayFrom(turnId: string, fromSentenceIndex: number): ServerMessage[] {
  const buffered = buffers.get(turnId);
  if (buffered === undefined) return [];
  return buffered.messages.filter((message) => {
    if (message.type !== "SENTENCE_AUDIO_READY") return true;
    return message.sentenceIndex >= fromSentenceIndex;
  });
}

export function closeBuffer(turnId: string): void {
  buffers.delete(turnId);
}

export function isBuffered(turnId: string): boolean {
  return buffers.has(turnId);
}

function evictOldest(): void {
  while (buffers.size > cachedSettings().turn.bufferSize) {
    let oldestId: string | null = null;
    let oldestAt = Number.POSITIVE_INFINITY;
    for (const [turnId, buffered] of buffers) {
      if (buffered.startedAt < oldestAt) {
        oldestAt = buffered.startedAt;
        oldestId = turnId;
      }
    }
    if (oldestId === null) return;
    buffers.delete(oldestId);
  }
}
