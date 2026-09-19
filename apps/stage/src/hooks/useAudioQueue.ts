import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

export type AudioChannel = "voice" | "ambience" | "foley";

const FINISH_POLL_MS = 120;

export interface AudioQueue {
  enqueueSentence: (sentenceIndex: number, url: string) => void;
  playingSentenceIndex: number | null;
  skipToEnd: () => void;
  playAmbience: (url: string) => void;
  stopAmbience: () => void;
  playFoley: (url: string) => void;
  reset: () => void;
}

export async function configureAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: "mixWithOthers",
  });
}

export function useAudioQueue(enabled: boolean): AudioQueue {
  const [playingSentenceIndex, setPlayingSentenceIndex] = useState<number | null>(null);

  const pending = useRef(new Map<number, string>());
  const nextIndex = useRef(0);
  const voice = useRef<AudioPlayer | null>(null);
  const ambience = useRef<AudioPlayer | null>(null);
  const foley = useRef<AudioPlayer | null>(null);
  const draining = useRef(false);

  const releaseVoice = useCallback(() => {
    voice.current?.remove();
    voice.current = null;
  }, []);

  const drain = useCallback(async (): Promise<void> => {
    if (draining.current || !enabled) return;
    draining.current = true;

    while (pending.current.has(nextIndex.current)) {
      const index = nextIndex.current;
      const url = pending.current.get(index);
      pending.current.delete(index);
      if (url === undefined) break;

      releaseVoice();
      const player = createAudioPlayer({ uri: url });
      voice.current = player;
      setPlayingSentenceIndex(index);
      player.play();

      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          if (voice.current !== player) {
            clearInterval(timer);
            resolve();
            return;
          }
          if (!player.playing && player.currentTime > 0) {
            clearInterval(timer);
            resolve();
          }
        }, FINISH_POLL_MS);
      });

      nextIndex.current = index + 1;
    }

    setPlayingSentenceIndex(null);
    draining.current = false;
  }, [enabled, releaseVoice]);

  const enqueueSentence = useCallback(
    (sentenceIndex: number, url: string) => {
      pending.current.set(sentenceIndex, url);
      void drain();
    },
    [drain],
  );

  const skipToEnd = useCallback(() => {
    pending.current.clear();
    releaseVoice();
    draining.current = false;
    setPlayingSentenceIndex(null);
  }, [releaseVoice]);

  const playAmbience = useCallback((url: string) => {
    ambience.current?.remove();
    const player = createAudioPlayer({ uri: url });
    player.loop = true;
    player.volume = 0.35;
    ambience.current = player;
    player.play();
  }, []);

  const stopAmbience = useCallback(() => {
    ambience.current?.remove();
    ambience.current = null;
  }, []);

  const playFoley = useCallback((url: string) => {
    foley.current?.remove();
    const player = createAudioPlayer({ uri: url });
    player.volume = 0.7;
    foley.current = player;
    player.play();
  }, []);

  const reset = useCallback(() => {
    skipToEnd();
    stopAmbience();
    foley.current?.remove();
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
