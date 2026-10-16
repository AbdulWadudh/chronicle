import { type CastName, parseAttributedLines } from "@chronicle/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TYPE_MS = 26;
const AUDIO_FILL = 0.72;

export interface RevealedSentence {
  key: string;
  text: string;
  speakerId: string | null;
}

export interface SentenceReveal {
  sentences: RevealedSentence[];
  visible: RevealedSentence[];
  isTyping: boolean;
  isComplete: boolean;
  revealAll: () => void;
}

export interface SentenceRevealOptions {
  cinemaMode: boolean;
  playingSentenceIndex: number | null;
  playingSentenceSeconds?: number | null;
  typing: boolean;
  held?: boolean;
  cast?: readonly CastName[];
}

interface Cursor {
  index: number;
  chars: number;
}

const START: Cursor = { index: 0, chars: 0 };
const NO_CAST: readonly CastName[] = [];

export function useSentenceReveal(text: string, options: SentenceRevealOptions): SentenceReveal {
  const {
    cinemaMode,
    playingSentenceIndex,
    playingSentenceSeconds = null,
    typing,
    held = false,
    cast = NO_CAST,
  } = options;

  const sentences = useMemo(() => {
    let offset = 0;
    return parseAttributedLines(text, cast).map((sentence): RevealedSentence => {
      const key = `s${offset}`;
      offset += sentence.text.length;
      return { key, text: sentence.text, speakerId: sentence.speakerId };
    });
  }, [text, cast]);

  const [skipped, setSkipped] = useState(false);
  const [cursor, setCursor] = useState<Cursor>(START);
  const previousText = useRef(text);

  if (previousText.current !== text) {
    const continues = text.startsWith(previousText.current);
    previousText.current = text;
    if (skipped) setSkipped(false);
    if (!continues) setCursor(START);
  }

  const gated =
    cinemaMode && playingSentenceIndex !== null
      ? Math.min(playingSentenceIndex + 1, sentences.length)
      : sentences.length;
  const limit = held ? 0 : gated;
  const instant = skipped || !typing;
  const target = sentences[cursor.index]?.text ?? "";
  const sentenceDone = cursor.chars >= target.length;
  const canAdvance = sentenceDone && cursor.index + 1 < limit;
  const typingActive = !instant && cursor.index < limit && (!sentenceDone || canAdvance);
  const paced =
    cinemaMode && playingSentenceSeconds !== null && cursor.index === playingSentenceIndex;
  const stepMs = paced
    ? Math.max(TYPE_MS, (playingSentenceSeconds * 1000 * AUDIO_FILL) / Math.max(1, target.length))
    : TYPE_MS;

  useEffect(() => {
    if (!typingActive) return;
    const timer = setInterval(() => {
      setCursor((current) => {
        const length = sentences[current.index]?.text.length ?? 0;
        if (current.chars < length) return { index: current.index, chars: current.chars + 1 };
        if (current.index + 1 < limit) return { index: current.index + 1, chars: 0 };
        return current;
      });
    }, stepMs);
    return () => clearInterval(timer);
  }, [typingActive, sentences, limit, stepMs]);

  const revealAll = useCallback(() => setSkipped(true), []);

  const visible = useMemo(() => {
    if (instant) return sentences.slice(0, limit);
    const shown = sentences.slice(0, Math.min(cursor.index + 1, limit));
    const last = shown.at(-1);
    if (last === undefined) return shown;
    return [...shown.slice(0, -1), { ...last, text: last.text.slice(0, cursor.chars) }];
  }, [sentences, limit, instant, cursor]);

  const lastIndex = sentences.length - 1;
  const typedOut =
    instant ||
    (cursor.index >= lastIndex && cursor.chars >= (sentences[lastIndex]?.text.length ?? 0));

  return {
    sentences,
    visible,
    isTyping: typingActive,
    isComplete: !held && gated >= sentences.length && typedOut,
    revealAll,
  };
}
