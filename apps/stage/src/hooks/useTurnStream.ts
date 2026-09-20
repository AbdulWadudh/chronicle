import { API } from "@chronicle/config";
import type { ServerMessage, TurnNode } from "@chronicle/utils";
import { useCallback, useEffect, useState } from "react";
import { get, post } from "~/lib/api";
import { useAudioQueue } from "./useAudioQueue";
import { type SocketStatus, useGameSocket } from "./useGameSocket";

const RENDER_TIMEOUT_MS = 180_000;

export interface PendingDiceCheck {
  turnId: string;
  checkId: string;
  stat: string;
  dc: number;
  baseModifier: number;
  roll: number;
  succeeded: boolean;
}

export interface TurnStream {
  status: SocketStatus;
  streamingText: string;
  activeTurnId: string | null;
  committedTurns: TurnNode[];
  sceneImageUrl: string | null;
  pendingCheck: PendingDiceCheck | null;
  playingSentenceIndex: number | null;
  error: string | null;
  submitAction: (action: string, directorWhisper: string | null) => void;
  selectChoice: (choiceIndex: 0 | 1 | 2, directorWhisper: string | null) => void;
  progressOf: (turnId: string) => number | null;
  abort: () => void;
  regenerate: (turnId: string, target: "narrative" | "audio") => void;
  repaintScene: (turnId: string, prompt: string | null) => void;
  isPainting: (turnId: string) => boolean;
  replayAudio: (turn: TurnNode) => void;
  acknowledgeDice: () => void;
  skipAudio: () => void;
}

export function useTurnStream(characterId: string | null, cinemaMode: boolean): TurnStream {
  const [streamingText, setStreamingText] = useState("");
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null);
  const [committedTurns, setCommittedTurns] = useState<TurnNode[]>([]);
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [pendingCheck, setPendingCheck] = useState<PendingDiceCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paintingTurnIds, setPaintingTurnIds] = useState<readonly string[]>([]);

  const stopPainting = useCallback((turnId: string) => {
    setPaintingTurnIds((previous) => previous.filter((id) => id !== turnId));
  }, []);

  const startPainting = useCallback(
    (turnId: string) => {
      setPaintingTurnIds((previous) =>
        previous.includes(turnId) ? previous : [...previous, turnId],
      );
      setTimeout(() => stopPainting(turnId), RENDER_TIMEOUT_MS);
    },
    [stopPainting],
  );
  const [progress, setProgress] = useState<Record<string, number>>({});

  const audio = useAudioQueue(cinemaMode);

  useEffect(() => {
    if (characterId === null) return;
    let cancelled = false;
    void (async () => {
      try {
        const history = await get<{ items: TurnNode[] }>(
          `${API.turns}?characterId=${encodeURIComponent(characterId)}`,
        );
        if (cancelled) return;
        setCommittedTurns(history.items);
        const last = history.items.at(-1);
        setSceneImageUrl(last?.sceneImageUrl ?? null);
        if (last !== undefined && last.sceneImageUrl === null) startPainting(last.id);
      } catch (cause) {
        if (!cancelled)
          setError(cause instanceof Error ? cause.message : "Could not load history.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [characterId, startPainting]);

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "TURN_INITIALIZED":
          setActiveTurnId(message.turnId);
          startPainting(message.turnId);
          setStreamingText("");
          setSceneImageUrl(null);
          setError(null);
          break;
        case "NARRATIVE_CHUNK":
          setStreamingText((previous) => previous + message.token);
          break;
        case "SENTENCE_AUDIO_READY":
          audio.enqueueSentence(message.sentenceIndex, message.audioUrl);
          break;
        case "SCENE_PROGRESS":
          setProgress((previous) => ({
            ...previous,
            [message.turnId]: Math.round((message.value / message.max) * 100),
          }));
          break;
        case "SCENE_IMAGE_READY":
          setSceneImageUrl(message.imageUrl);
          stopPainting(message.turnId);
          setProgress(({ [message.turnId]: _done, ...rest }) => rest);
          setCommittedTurns((previous) =>
            previous.map((turn) =>
              turn.id === message.turnId ? { ...turn, sceneImageUrl: message.imageUrl } : turn,
            ),
          );
          break;
        case "DICE_CHECK_REQUIRED":
          setPendingCheck({
            turnId: message.turnId,
            checkId: message.checkId,
            stat: message.stat,
            dc: message.dc,
            baseModifier: message.baseModifier,
            roll: message.roll,
            succeeded: message.succeeded,
          });
          break;
        case "TURN_COMMITTED":
          setCommittedTurns((previous) =>
            previous.some((turn) => turn.id === message.turn.id)
              ? previous.map((turn) => (turn.id === message.turn.id ? message.turn : turn))
              : [...previous, message.turn],
          );
          setStreamingText("");
          setActiveTurnId(null);
          break;
        case "ERROR":
          setError(message.message);
          setActiveTurnId(null);
          if (message.turnId !== null) {
            const failed = message.turnId;
            stopPainting(failed);
          }
          break;
        default:
          break;
      }
    },
    [audio, startPainting, stopPainting],
  );

  const socket = useGameSocket(characterId, handleMessage);

  const submitAction = useCallback(
    (action: string, directorWhisper: string | null) => {
      const parentTurnId = committedTurns.at(-1)?.id ?? null;
      socket.send({
        type: "SUBMIT_ACTION",
        parentTurnId,
        action,
        mode: "scratch",
        directorWhisper,
      });
    },
    [committedTurns, socket],
  );

  const selectChoice = useCallback(
    (choiceIndex: 0 | 1 | 2, directorWhisper: string | null) => {
      const parentTurnId = committedTurns.at(-1)?.id;
      if (parentTurnId === undefined) return;
      socket.send({ type: "SELECT_CHOICE", parentTurnId, choiceIndex, directorWhisper });
    },
    [committedTurns, socket],
  );

  const progressOf = useCallback(
    (turnId: string): number | null => progress[turnId] ?? null,
    [progress],
  );

  const regenerate = useCallback(
    (turnId: string, target: "narrative" | "audio") => {
      socket.send({ type: "REGENERATE", turnId, target });
      if (target === "narrative") startPainting(turnId);
    },
    [socket, startPainting],
  );

  const repaintScene = useCallback(
    (turnId: string, prompt: string | null) => {
      startPainting(turnId);
      void post(`${API.turns}/${turnId}/scene`, { prompt }).catch((cause: unknown) => {
        stopPainting(turnId);
        setError(cause instanceof Error ? cause.message : "The scene could not be repainted.");
      });
    },
    [startPainting, stopPainting],
  );

  const isPainting = useCallback(
    (turnId: string): boolean => paintingTurnIds.includes(turnId),
    [paintingTurnIds],
  );

  const replayAudio = useCallback(
    (turn: TurnNode) => {
      audio.reset();
      for (const clip of turn.audioUrls) audio.enqueueSentence(clip.sentenceIndex, clip.audioUrl);
    },
    [audio],
  );

  const abort = useCallback(() => {
    if (activeTurnId === null) return;
    socket.send({ type: "ABORT_TURN", turnId: activeTurnId });
  }, [activeTurnId, socket]);

  const acknowledgeDice = useCallback(() => {
    setPendingCheck(null);
  }, []);

  return {
    status: socket.status,
    streamingText,
    activeTurnId,
    committedTurns,
    sceneImageUrl,
    pendingCheck,
    playingSentenceIndex: audio.playingSentenceIndex,
    error: error ?? socket.lastError,
    submitAction,
    selectChoice,
    progressOf,
    abort,
    regenerate,
    repaintScene,
    isPainting,
    replayAudio,
    acknowledgeDice,
    skipAudio: audio.skipToEnd,
  };
}
