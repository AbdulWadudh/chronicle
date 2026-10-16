import type { TurnNode } from "@chronicle/utils";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useCast } from "~/components/story/CastContext";
import { useSentenceReveal } from "~/components/story/useSentenceReveal";
import type { TurnStream } from "~/hooks/useTurnStream";
import { SceneStage } from "./SceneStage";

const FADE = { duration: 0.35, ease: "easeOut" } as const;
const CLOSE_BEAT_MS = 900;

export interface ReplayOverlayProps {
  turn: TurnNode;
  stream: TurnStream;
  reduceMotion: boolean;
  typing: boolean;
  onClose: () => void;
}

export function ReplayOverlay({ turn, stream, reduceMotion, typing, onClose }: ReplayOverlayProps) {
  const cast = useCast();
  const reveal = useSentenceReveal(turn.narrativeText, {
    cinemaMode: true,
    playingSentenceIndex: stream.playingSentenceIndex,
    playingSentenceSeconds: stream.playingSentenceSeconds,
    typing,
    held: stream.replayRevealing,
    cast,
  });
  const done = reveal.isComplete && stream.playingSentenceIndex === null;

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(onClose, CLOSE_BEAT_MS);
    return () => clearTimeout(timer);
  }, [done, onClose]);

  function close(): void {
    stream.skipAudio();
    onClose();
  }

  return (
    <motion.div
      role="dialog"
      aria-label={`Replaying: ${turn.playerAction}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE}
      className="fixed inset-0 z-50 flex flex-col bg-canvas pt-(--safe-top) pb-(--safe-bottom)"
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-4">
        <SceneStage
          phase="cinematic"
          stream={stream}
          turn={turn}
          previous={null}
          reveal={reveal}
          busy={false}
          cinemaMode
          reduceMotion={reduceMotion}
          composingScene={null}
          onComposeScene={async () => null}
          onEndCinematic={close}
          layoutId={`replay-${turn.id}`}
          hint="Tap to close"
        />
      </div>
    </motion.div>
  );
}
