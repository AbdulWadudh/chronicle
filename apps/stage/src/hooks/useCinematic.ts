import { useCallback, useEffect, useRef, useState } from "react";

const REPLAY_REVEAL_MS = 1600;

export interface Cinematic {
  cinematicTurnId: string | null;
  replayTurnId: string | null;
  replayRevealing: boolean;
  replayKey: number;
  enter: () => void;
  end: () => void;
  markReplay: (turnId: string) => void;
  endReplay: () => void;
}

export function useCinematic(activeTurnId: string | null, immersive: boolean): Cinematic {
  const [cinematicTurnId, setCinematicTurnId] = useState<string | null>(null);
  const [replayTurnId, setReplayTurnId] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [replayRevealing, setReplayRevealing] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (immersive && activeTurnId !== null) setCinematicTurnId(activeTurnId);
  }, [immersive, activeTurnId]);

  const enter = useCallback(() => {
    if (activeTurnId !== null) setCinematicTurnId(activeTurnId);
  }, [activeTurnId]);

  const end = useCallback(() => setCinematicTurnId(null), []);

  const markReplay = useCallback((turnId: string) => {
    setReplayTurnId(turnId);
    setReplayRevealing(true);
    if (revealTimer.current !== null) clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => setReplayRevealing(false), REPLAY_REVEAL_MS);
    setReplayKey((count) => count + 1);
  }, []);

  const endReplay = useCallback(() => {
    setReplayTurnId(null);
    setReplayRevealing(false);
  }, []);

  return {
    cinematicTurnId,
    replayTurnId,
    replayRevealing,
    replayKey,
    enter,
    end,
    markReplay,
    endReplay,
  };
}
