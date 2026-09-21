import { API } from "@chronicle/config";
import type { ImageShape, ServerMessage, TurnNode } from "@chronicle/utils";
import { useCallback, useEffect, useState } from "react";
import { get, post } from "~/lib/api";
import { useAudioQueue } from "./useAudioQueue";
import { type SocketStatus, useGameSocket } from "./useGameSocket";
import { type SceneProgress, useScenePainting } from "./useScenePainting";

export type PlayPhase = "cinematic" | "decision";

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
  phase: PlayPhase;
  replayTurnId: string | null;
  replayKey: number;
  sceneReady: boolean;
  holdNarration: boolean;
  streamingText: string;
  activeTurnId: string | null;
  committedTurns: TurnNode[];
  sceneImageUrl: string | null;
  sceneShape: ImageShape | null;
  pendingCheck: PendingDiceCheck | null;
  playingSentenceIndex: number | null;
  error: string | null;
  isRerollingChoices: boolean;
  submitAction: (
    action: string,
    directorWhisper: string | null,
    mentionedCharacterIds?: string[],
  ) => void;
  selectChoice: (choiceIndex: 0 | 1 | 2, directorWhisper: string | null) => void;
  progressOf: (turnId: string) => SceneProgress | null;
  abort: () => void;
  endCinematic: () => void;
  endReplay: () => void;
  regenerate: (turnId: string, target: "narrative" | "audio" | "choices") => void;
  repaintScene: (turnId: string, prompt: string | null) => void;
  isPainting: (turnId: string) => boolean;
  replayTurn: (turn: TurnNode) => void;
  replayAudio: (turn: TurnNode) => void;
  acknowledgeDice: () => void;
  skipAudio: () => void;
}

export function useTurnStream(characterId: string | null, immersive: boolean): TurnStream {
  const [streamingText, setStreamingText] = useState("");
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null);
  const [committedTurns, setCommittedTurns] = useState<TurnNode[]>([]);
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [sceneShape, setSceneShape] = useState<ImageShape | null>(null);
  const [pendingCheck, setPendingCheck] = useState<PendingDiceCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cinematicTurnId, setCinematicTurnId] = useState<string | null>(null);
  const [replayTurnId, setReplayTurnId] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [isRerollingChoices, setIsRerollingChoices] = useState(false);
  const painting = useScenePainting();

  const latest = committedTurns.at(-1);
  const sceneReady =
    activeTurnId !== null
      ? sceneImageUrl !== null
      : latest === undefined || !painting.isPainting(latest.id);
  const holdNarration = cinematicTurnId !== null && !sceneReady;
  const audio = useAudioQueue(holdNarration);

  useEffect(() => {
    if (immersive && activeTurnId !== null) setCinematicTurnId(activeTurnId);
  }, [immersive, activeTurnId]);

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
        if (last !== undefined && last.sceneImageUrl === null) painting.start(last.id);
      } catch (cause) {
        if (!cancelled)
          setError(cause instanceof Error ? cause.message : "Could not load history.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [characterId, painting.start]);

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "TURN_INITIALIZED":
          audio.reset();
          setActiveTurnId(message.turnId);
          painting.start(message.turnId);
          setStreamingText("");
          setSceneImageUrl(null);
          setSceneShape(null);
          setError(null);
          break;
        case "SCENE_PLANNED":
          setSceneShape(message.shape);
          break;
        case "NARRATIVE_CHUNK":
          setStreamingText((previous) => previous + message.token);
          break;
        case "SENTENCE_AUDIO_READY":
          audio.enqueueSentence(message.sentenceIndex, message.audioUrl);
          setCommittedTurns((previous) =>
            previous.map((turn) =>
              turn.id === message.turnId
                ? {
                    ...turn,
                    audioUrls: [
                      ...turn.audioUrls.filter(
                        (clip) => clip.sentenceIndex !== message.sentenceIndex,
                      ),
                      { sentenceIndex: message.sentenceIndex, audioUrl: message.audioUrl },
                    ].sort((left, right) => left.sentenceIndex - right.sentenceIndex),
                  }
                : turn,
            ),
          );
          break;
        case "SCENE_PROGRESS":
          painting.report(message.turnId, message.value, message.max, message.stage);
          break;
        case "SCENE_IMAGE_READY":
          setSceneImageUrl(message.imageUrl);
          painting.finish(message.turnId);
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
          setIsRerollingChoices(false);
          setCommittedTurns((previous) =>
            previous.some((turn) => turn.id === message.turn.id)
              ? previous.map((turn) => (turn.id === message.turn.id ? message.turn : turn))
              : [...previous, message.turn],
          );
          setStreamingText("");
          setActiveTurnId(null);
          break;
        case "ERROR":
          setIsRerollingChoices(false);
          setError(message.message);
          setActiveTurnId(null);
          if (message.turnId !== null) painting.stop(message.turnId);
          break;
        default:
          break;
      }
    },
    [audio, painting],
  );

  const socket = useGameSocket(characterId, handleMessage);

  const submitAction = useCallback(
    (action: string, directorWhisper: string | null, mentionedCharacterIds?: string[]) => {
      const parentTurnId = committedTurns.at(-1)?.id ?? null;
      socket.send({
        type: "SUBMIT_ACTION",
        parentTurnId,
        action,
        mode: "scratch",
        directorWhisper,
        mentionedCharacterIds,
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

  const regenerate = useCallback(
    (turnId: string, target: "narrative" | "audio" | "choices") => {
      socket.send({ type: "REGENERATE", turnId, target });
      if (target === "narrative") painting.start(turnId);
      else if (target === "audio") audio.reset();
      else if (target === "choices") setIsRerollingChoices(true);
    },
    [socket, painting, audio],
  );

  const repaintScene = useCallback(
    (turnId: string, prompt: string | null) => {
      painting.start(turnId);
      void post(`${API.turns}/${turnId}/scene`, { prompt }).catch((cause: unknown) => {
        painting.stop(turnId);
        setError(cause instanceof Error ? cause.message : "The scene could not be repainted.");
      });
    },
    [painting],
  );

  const replayAudio = useCallback(
    (turn: TurnNode) => {
      audio.reset();
      for (const clip of turn.audioUrls) audio.enqueueSentence(clip.sentenceIndex, clip.audioUrl);
    },
    [audio],
  );

  const replayTurn = useCallback(
    (turn: TurnNode) => {
      audio.reset();
      setReplayTurnId(turn.id);
      setReplayKey((count) => count + 1);
      for (const clip of turn.audioUrls) audio.enqueueSentence(clip.sentenceIndex, clip.audioUrl);
    },
    [audio],
  );

  const abort = useCallback(() => {
    setIsRerollingChoices(false);
    if (activeTurnId === null) return;
    socket.send({ type: "ABORT_TURN", turnId: activeTurnId });
  }, [activeTurnId, socket]);

  const endCinematic = useCallback(() => setCinematicTurnId(null), []);
  const endReplay = useCallback(() => setReplayTurnId(null), []);
  const acknowledgeDice = useCallback(() => setPendingCheck(null), []);

  return {
    status: socket.status,
    phase: cinematicTurnId === null ? "decision" : "cinematic",
    replayTurnId,
    replayKey,
    sceneReady,
    holdNarration,
    streamingText,
    activeTurnId,
    committedTurns,
    sceneImageUrl,
    sceneShape,
    pendingCheck,
    playingSentenceIndex: audio.playingSentenceIndex,
    error: error ?? socket.lastError,
    isRerollingChoices,
    submitAction,
    selectChoice,
    progressOf: painting.progressOf,
    abort,
    endCinematic,
    endReplay,
    regenerate,
    repaintScene,
    isPainting: painting.isPainting,
    replayTurn,
    replayAudio,
    acknowledgeDice,
    skipAudio: audio.skipToEnd,
  };
}
