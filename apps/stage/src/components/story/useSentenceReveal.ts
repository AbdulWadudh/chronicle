import { splitIntoSentences } from "@chronicle/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TIMED_SENTENCE_MS = 1400;

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
  const [timedCount, setTimedCount] = useState(0);
  const previousText = useRef(text);

  if (previousText.current !== text) {
    previousText.current = text;
    if (skipped) setSkipped(false);
  }

  useEffect(() => {
    if (cinemaMode || skipped) return;
    setTimedCount(0);
    const timer = setInterval(() => {
      setTimedCount((count) => {
        if (count >= sentences.length) {
          clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, TIMED_SENTENCE_MS);
    return () => clearInterval(timer);
  }, [cinemaMode, sentences.length, skipped]);

  const revealAll = useCallback(() => setSkipped(true), []);

  const gatedCount = cinemaMode
    ? playingSentenceIndex === null
      ? Math.min(1, sentences.length)
      : Math.min(playingSentenceIndex + 1, sentences.length)
    : Math.min(timedCount, sentences.length);

  const revealedCount = skipped ? sentences.length : gatedCount;

  return {
    sentences,
    revealedCount,
    isComplete: revealedCount >= sentences.length,
    revealAll,
  };
}
