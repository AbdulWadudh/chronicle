import { useCallback, useEffect, useState } from "react";

export interface Cinematic {
  cinematicTurnId: string | null;
  replayTurnId: string | null;
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

  useEffect(() => {
    if (immersive && activeTurnId !== null) setCinematicTurnId(activeTurnId);
  }, [immersive, activeTurnId]);

  const enter = useCallback(() => {
    if (activeTurnId !== null) setCinematicTurnId(activeTurnId);
  }, [activeTurnId]);

  const end = useCallback(() => setCinematicTurnId(null), []);

  const markReplay = useCallback((turnId: string) => {
    setReplayTurnId(turnId);
    setReplayKey((count) => count + 1);
  }, []);

  const endReplay = useCallback(() => setReplayTurnId(null), []);

  return { cinematicTurnId, replayTurnId, replayKey, enter, end, markReplay, endReplay };
}
