import { API } from "@chronicle/config";
import type { ServerMessage, TurnNode } from "@chronicle/utils";
import { useCallback, useEffect, useState } from "react";
import { get } from "~/lib/api";
import { useAudioQueue } from "./useAudioQueue";
import { type SocketStatus, useGameSocket } from "./useGameSocket";

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
  submitAction: (action: string, mode: "scratch" | "enhanced") => void;
  selectChoice: (choiceIndex: 0 | 1 | 2) => void;
  abort: () => void;
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
        setSceneImageUrl(history.items.at(-1)?.sceneImageUrl ?? null);
      } catch (cause) {
        if (!cancelled)
          setError(cause instanceof Error ? cause.message : "Could not load history.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [characterId]);

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "TURN_INITIALIZED":
          setActiveTurnId(message.turnId);
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
        case "SCENE_IMAGE_READY":
          setSceneImageUrl(message.imageUrl);
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
          setCommittedTurns((previous) => [...previous, message.turn]);
          setStreamingText("");
          setActiveTurnId(null);
          break;
        case "ERROR":
          setError(message.message);
          setActiveTurnId(null);
          break;
        default:
          break;
      }
    },
    [audio],
  );

  const socket = useGameSocket(characterId, handleMessage);

  const submitAction = useCallback(
    (action: string, mode: "scratch" | "enhanced") => {
      const parentTurnId = committedTurns.at(-1)?.id ?? null;
      socket.send({ type: "SUBMIT_ACTION", parentTurnId, action, mode });
    },
    [committedTurns, socket],
  );

  const selectChoice = useCallback(
    (choiceIndex: 0 | 1 | 2) => {
      const parentTurnId = committedTurns.at(-1)?.id;
      if (parentTurnId === undefined) return;
      socket.send({ type: "SELECT_CHOICE", parentTurnId, choiceIndex });
    },
    [committedTurns, socket],
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
    abort,
    acknowledgeDice,
    skipAudio: audio.skipToEnd,
  };
}
