import { useCallback, useEffect, useRef, useState } from "react";
import { assetUrl } from "~/lib/assets";

export type AudioChannel = "voice" | "ambience" | "foley";

const AMBIENCE_VOLUME = 0.35;
const FOLEY_VOLUME = 0.7;

export interface AudioQueue {
  enqueueSentence: (sentenceIndex: number, url: string) => void;
  playingSentenceIndex: number | null;
  skipToEnd: () => void;
  playAmbience: (url: string) => void;
  stopAmbience: () => void;
  playFoley: (url: string) => void;
  reset: () => void;
}

function release(element: HTMLAudioElement | null): void {
  if (element === null) return;
  element.pause();
  element.removeAttribute("src");
  element.load();
}

export function useAudioQueue(held: boolean): AudioQueue {
  const [playingSentenceIndex, setPlayingSentenceIndex] = useState<number | null>(null);

  const pending = useRef(new Map<number, string>());
  const nextIndex = useRef(0);
  const voice = useRef<HTMLAudioElement | null>(null);
  const ambience = useRef<HTMLAudioElement | null>(null);
  const foley = useRef<HTMLAudioElement | null>(null);
  const draining = useRef(false);
  const generation = useRef(0);
  const settleVoice = useRef<(() => void) | null>(null);

  const releaseVoice = useCallback(() => {
    release(voice.current);
    voice.current = null;
    settleVoice.current?.();
    settleVoice.current = null;
  }, []);

  const drain = useCallback(async (): Promise<void> => {
    if (draining.current || held) return;
    draining.current = true;
    const run = generation.current;

    while (run === generation.current && pending.current.has(nextIndex.current)) {
      const index = nextIndex.current;
      const url = pending.current.get(index);
      pending.current.delete(index);
      if (url === undefined) break;

      releaseVoice();
      const player = new Audio(assetUrl(url));
      voice.current = player;
      setPlayingSentenceIndex(index);

      await new Promise<void>((resolve) => {
        const settle = (): void => {
          settleVoice.current = null;
          resolve();
        };
        settleVoice.current = settle;
        player.addEventListener("ended", settle, { once: true });
        player.addEventListener("error", settle, { once: true });
        void player.play().catch(settle);
      });

      nextIndex.current = index + 1;
    }

    if (run !== generation.current) return;
    setPlayingSentenceIndex(null);
    draining.current = false;
  }, [held, releaseVoice]);

  useEffect(() => {
    if (!held) void drain();
  }, [held, drain]);

  const enqueueSentence = useCallback(
    (sentenceIndex: number, url: string) => {
      pending.current.set(sentenceIndex, url);
      void drain();
    },
    [drain],
  );

  const skipToEnd = useCallback(() => {
    generation.current += 1;
    pending.current.clear();
    releaseVoice();
    draining.current = false;
    setPlayingSentenceIndex(null);
  }, [releaseVoice]);

  const playAmbience = useCallback((url: string) => {
    release(ambience.current);
    const player = new Audio(assetUrl(url));
    player.loop = true;
    player.volume = AMBIENCE_VOLUME;
    ambience.current = player;
    void player.play().catch(() => undefined);
  }, []);

  const stopAmbience = useCallback(() => {
    release(ambience.current);
    ambience.current = null;
  }, []);

  const playFoley = useCallback((url: string) => {
    release(foley.current);
    const player = new Audio(assetUrl(url));
    player.volume = FOLEY_VOLUME;
    foley.current = player;
    void player.play().catch(() => undefined);
  }, []);

  const reset = useCallback(() => {
    skipToEnd();
    stopAmbience();
    release(foley.current);
    foley.current = null;
    nextIndex.current = 0;
  }, [skipToEnd, stopAmbience]);

  useEffect(() => reset, [reset]);

  return {
    enqueueSentence,
    playingSentenceIndex,
    skipToEnd,
    playAmbience,
    stopAmbience,
    playFoley,
    reset,
  };
}
