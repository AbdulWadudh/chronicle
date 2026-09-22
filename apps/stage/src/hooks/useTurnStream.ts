import { API } from "@chronicle/config";
import type { ImageShape, ServerMessage, TurnNode } from "@chronicle/utils";
import { useCallback, useState } from "react";
import { mergeSentenceAudio } from "~/hooks/mergeSentenceAudio";
import { post } from "~/lib/api";
import { assetUrl } from "~/lib/assets";
import { useAudioQueue } from "./useAudioQueue";
import { useCinematic } from "./useCinematic";
import { type SocketStatus, useGameSocket } from "./useGameSocket";
import { type SceneProgress, useScenePainting } from "./useScenePainting";
import { useTurnHistory } from "./useTurnHistory";

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
  hasOlderTurns: boolean;
  loadingOlder: boolean;
  loadOlderTurns: () => void;
  submitAction: (
    action: string,
    directorWhisper: string | null,
    mentionedCharacterIds?: string[],
  ) => void;
  selectChoice: (choiceIndex: 0 | 1 | 2, directorWhisper: string | null) => void;
  progressOf: (turnId: string) => SceneProgress | null;
  abort: () => void;
  endCinematic: () => void;
  enterCinematic: () => void;
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
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [sceneShape, setSceneShape] = useState<ImageShape | null>(null);
  const [pendingCheck, setPendingCheck] = useState<PendingDiceCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRerollingChoices, setIsRerollingChoices] = useState(false);
  const painting = useScenePainting();

  const onFirstPage = useCallback(
    (items: TurnNode[]) => {
      const last = items.at(-1);
      setSceneImageUrl(last?.sceneImageUrl ?? null);
      if (last !== undefined && last.sceneImageUrl === null) painting.start(last.id);
    },
    [painting.start],
  );

  const history = useTurnHistory(characterId, onFirstPage);
  const { turns: committedTurns, setTurns: setCommittedTurns } = history;

  const latest = committedTurns.at(-1);
  const sceneReady =
    activeTurnId !== null
      ? sceneImageUrl !== null
      : latest === undefined || !painting.isPainting(latest.id);
  const cinematic = useCinematic(activeTurnId, immersive);
  const holdNarration = cinematic.cinematicTurnId !== null && !sceneReady;
  const audio = useAudioQueue(holdNarration);

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
            mergeSentenceAudio(previous, message.turnId, {
              sentenceIndex: message.sentenceIndex,
              audioUrl: message.audioUrl,
              speakerId: message.speakerId,
            }),
          );
          break;
        case "SCENE_PROGRESS":
          painting.report(
            message.turnId,
            message.value,
            message.max,
            message.stage,
            message.preview,
          );
          break;
        case "SCENE_IMAGE_READY": {
          const { turnId, imageUrl } = message;
          const reveal = (): void => {
            setSceneImageUrl(imageUrl);
            painting.finish(turnId);
            setCommittedTurns((previous) =>
              previous.map((turn) =>
                turn.id === turnId ? { ...turn, sceneImageUrl: imageUrl } : turn,
              ),
            );
          };
          const preload = new Image();
          preload.onload = reveal;
          preload.onerror = reveal;
          preload.src = assetUrl(imageUrl);
          break;
        }
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
    [audio, painting, setCommittedTurns],
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
      cinematic.markReplay(turn.id);
      for (const clip of turn.audioUrls) audio.enqueueSentence(clip.sentenceIndex, clip.audioUrl);
    },
    [audio, cinematic],
  );

  const abort = useCallback(() => {
    setIsRerollingChoices(false);
    if (activeTurnId === null) return;
    socket.send({ type: "ABORT_TURN", turnId: activeTurnId });
  }, [activeTurnId, socket]);

  const acknowledgeDice = useCallback(() => setPendingCheck(null), []);

  return {
    status: socket.status,
    phase: cinematic.cinematicTurnId === null ? "decision" : "cinematic",
    replayTurnId: cinematic.replayTurnId,
    replayKey: cinematic.replayKey,
    sceneReady,
    holdNarration,
    streamingText,
    activeTurnId,
    committedTurns,
    sceneImageUrl,
    sceneShape,
    pendingCheck,
    playingSentenceIndex: audio.playingSentenceIndex,
    error: error ?? history.error ?? socket.lastError,
    isRerollingChoices,
    hasOlderTurns: history.hasOlderTurns,
    loadingOlder: history.loadingOlder,
    loadOlderTurns: history.loadOlderTurns,
    submitAction,
    selectChoice,
    progressOf: painting.progressOf,
    abort,
    endCinematic: cinematic.end,
    enterCinematic: cinematic.enter,
    endReplay: cinematic.endReplay,
    regenerate,
    repaintScene,
    isPainting: painting.isPainting,
    replayTurn,
    replayAudio,
    acknowledgeDice,
    skipAudio: audio.skipToEnd,
  };
}
