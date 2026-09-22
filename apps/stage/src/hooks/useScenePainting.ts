import type { ImageStage } from "@chronicle/utils";
import { useCallback, useState } from "react";

const RENDER_TIMEOUT_MS = 180_000;

export interface SceneProgress {
  percent: number;
  stage: ImageStage;
  preview: string | null;
}

export interface ScenePainting {
  start: (turnId: string) => void;
  stop: (turnId: string) => void;
  finish: (turnId: string) => void;
  report: (
    turnId: string,
    value: number,
    max: number,
    stage: ImageStage,
    preview: string | null,
  ) => void;
  isPainting: (turnId: string) => boolean;
  progressOf: (turnId: string) => SceneProgress | null;
}

export function useScenePainting(): ScenePainting {
  const [paintingTurnIds, setPaintingTurnIds] = useState<readonly string[]>([]);
  const [progress, setProgress] = useState<Record<string, SceneProgress>>({});

  const stop = useCallback((turnId: string) => {
    setPaintingTurnIds((previous) => previous.filter((id) => id !== turnId));
  }, []);

  const start = useCallback(
    (turnId: string) => {
      setPaintingTurnIds((previous) =>
        previous.includes(turnId) ? previous : [...previous, turnId],
      );
      setTimeout(() => stop(turnId), RENDER_TIMEOUT_MS);
    },
    [stop],
  );

  const finish = useCallback(
    (turnId: string) => {
      stop(turnId);
      setProgress(({ [turnId]: _done, ...rest }) => rest);
    },
    [stop],
  );

  const report = useCallback(
    (turnId: string, value: number, max: number, stage: ImageStage, preview: string | null) => {
      setProgress((previous) => ({
        ...previous,
        [turnId]: {
          percent: Math.round((value / max) * 100),
          stage,
          preview: preview ?? previous[turnId]?.preview ?? null,
        },
      }));
    },
    [],
  );

  const isPainting = useCallback(
    (turnId: string): boolean => paintingTurnIds.includes(turnId),
    [paintingTurnIds],
  );

  const progressOf = useCallback(
    (turnId: string): SceneProgress | null => progress[turnId] ?? null,
    [progress],
  );

  return { start, stop, finish, report, isPainting, progressOf };
}
