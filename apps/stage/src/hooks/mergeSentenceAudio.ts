import type { SentenceAudio, TurnNode } from "@chronicle/utils";

export function mergeSentenceAudio(
  turns: readonly TurnNode[],
  turnId: string,
  clip: SentenceAudio,
): TurnNode[] {
  return turns.map((turn) =>
    turn.id === turnId
      ? {
          ...turn,
          audioUrls: [
            ...turn.audioUrls.filter((entry) => entry.sentenceIndex !== clip.sentenceIndex),
            clip,
          ].sort((left, right) => left.sentenceIndex - right.sentenceIndex),
        }
      : turn,
  );
}
