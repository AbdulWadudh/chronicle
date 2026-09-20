import { splitIntoSentences } from "@chronicle/utils";
import { useCallback, useMemo, useRef, useState } from "react";

export interface RevealedSentence {
  key: string;
  text: string;
}

export interface SentenceReveal {
  sentences: RevealedSentence[];
  revealedCount: number;
  isComplete: boolean;
  revealAll: () => void;
}

export function useSentenceReveal(
  text: string,
  cinemaMode: boolean,
  playingSentenceIndex: number | null,
): SentenceReveal {
  const sentences = useMemo(() => {
    let offset = 0;
    return splitIntoSentences(text).map((sentence) => {
      const key = `s${offset}`;
      offset += sentence.length;
      return { key, text: sentence };
    });
  }, [text]);

  const [skipped, setSkipped] = useState(false);
  const previousText = useRef(text);

  if (previousText.current !== text) {
    previousText.current = text;
    if (skipped) setSkipped(false);
  }

  const revealAll = useCallback(() => setSkipped(true), []);

  const gatedCount =
    cinemaMode && playingSentenceIndex !== null
      ? Math.min(playingSentenceIndex + 1, sentences.length)
      : sentences.length;

  const revealedCount = skipped ? sentences.length : gatedCount;

  return {
    sentences,
    revealedCount,
    isComplete: revealedCount >= sentences.length,
    revealAll,
  };
}
