import { API } from "@chronicle/config";
import type { ComposeMode, TurnNode } from "@chronicle/utils";
import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { EmptyState } from "~/components/common/EmptyState";
import { Composer } from "~/components/story/Composer";
import { DirectorConsoleModal } from "~/components/story/DirectorConsoleModal";
import { useFollowScroll } from "~/components/story/useFollowScroll";
import { useSentenceReveal } from "~/components/story/useSentenceReveal";
import { useCharacterSheet } from "~/hooks/useCharacterSheet";
import { useCompose } from "~/hooks/useCompose";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import { useTurnStream } from "~/hooks/useTurnStream";
import { post } from "~/lib/api";
import { useThemeStore } from "~/theme/store";
import { DiceOverlay } from "./DiceOverlay";
import { PlayHeader } from "./PlayHeader";
import { PlayScript } from "./PlayScript";
import { ReplayOverlay } from "./ReplayOverlay";
import { SceneBackdrop } from "./SceneBackdrop";
import { SceneStage } from "./SceneStage";
import { StoryMapModal } from "./StoryMapModal";

const CINEMATIC_BEAT_MS = 900;

export function Play() {
  const navigate = useNavigate();
  const { id = null } = useParams<{ id: string }>();
  const cinemaMode = useThemeStore((state) => state.cinemaMode);
  const immersive = useThemeStore((state) => state.immersive);
  const setActiveStory = useThemeStore((state) => state.setActiveStory);
  const motionLevel = useThemeStore((state) => state.motionLevel);
  const reduceMotion = useReducedMotion() || motionLevel === "off";

  const stream = useTurnStream(id, immersive);
  const sheet = useCharacterSheet(id);
  const compose = useCompose();
  const [whisper, setWhisper] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const follow = useFollowScroll();

  useEffect(() => {
    setActiveStory(id);
    return () => setActiveStory(null);
  }, [id, setActiveStory]);

  const latest = stream.committedTurns.at(-1);
  const busy = stream.activeTurnId !== null;
  const replaying = stream.committedTurns.find((turn) => turn.id === stream.replayTurnId) ?? null;
  const stageTurn = busy ? null : (latest ?? null);
  const previous = (busy ? latest : stream.committedTurns.at(-2)) ?? null;
  const history = busy ? stream.committedTurns : stream.committedTurns.slice(0, -1);
  const stageText = busy ? stream.streamingText : (stageTurn?.narrativeText ?? "");
  const { phase, endCinematic } = stream;
  const cinematic = phase === "cinematic";
  const reveal = useSentenceReveal(stageText, {
    cinemaMode: cinemaMode || cinematic,
    playingSentenceIndex: replaying === null ? stream.playingSentenceIndex : null,
    typing: immersive && !reduceMotion,
    held: stream.holdNarration,
  });
  const cinematicDone =
    cinematic &&
    !busy &&
    stream.sceneReady &&
    reveal.isComplete &&
    stream.playingSentenceIndex === null;

  useEffect(() => {
    if (!cinematicDone) return;
    const timer = setTimeout(endCinematic, CINEMATIC_BEAT_MS);
    return () => clearTimeout(timer);
  }, [cinematicDone, endCinematic]);
  const empty = latest === undefined && !busy;
  const choices =
    phase === "decision" && stageTurn !== null && reveal.isComplete ? stageTurn.choices : [];

  function submitAction(action: string, mentionedCharacterIds?: string[]): void {
    stream.submitAction(
      action,
      whisper.trim().length > 0 ? whisper.trim() : null,
      mentionedCharacterIds,
    );
    setWhisper("");
  }

  function selectChoice(choiceIndex: 0 | 1 | 2): void {
    stream.selectChoice(choiceIndex, whisper.trim().length > 0 ? whisper.trim() : null);
    setWhisper("");
  }

  async function saveCheckpoint(name: string): Promise<void> {
    if (latest === undefined) return;
    await post(`${API.turns}/checkpoints`, { turnId: latest.id, name });
  }

  async function composeAction(mode: ComposeMode, draft: string): Promise<string | null> {
    return compose.run("turn.action", mode, {
      action: draft,
      name: sheet.name,
      strengths: sheet.strengths,
      situation: latest?.narrativeText ?? "",
      avoid: stream.committedTurns.slice(-4).map((turn) => turn.playerAction),
    });
  }

  async function composeWhisper(mode: ComposeMode, draft: string): Promise<string | null> {
    return compose.run("turn.whisper", mode, {
      whisper: draft,
      name: sheet.name,
      situation: latest?.narrativeText ?? "",
    });
  }

  async function composeScene(
    turn: TurnNode,
    mode: ComposeMode,
    draft: string,
  ): Promise<string | null> {
    return compose.run("turn.scene", mode, {
      scenePrompt: draft,
      situation: turn.narrativeText,
    });
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden pt-(--safe-top) pb-(--safe-bottom)">
      <SceneBackdrop imageUrl={latest?.sceneImageUrl ?? stream.sceneImageUrl} />
      <PlayHeader
        status={stream.status}
        worldTitle={sheet.worldTitle}
        characterName={sheet.name}
        onBack={() => void navigate(-1)}
        onOpenMap={() => setMapOpen(true)}
        onOpenConsole={() => setConsoleOpen(true)}
      />

      {stream.error !== null || compose.error !== null ? (
        <p
          role="alert"
          className="relative shrink-0 border-b border-danger/20 bg-danger/10 px-4 py-2 text-[0.8125rem] text-danger"
        >
          {stream.error ?? compose.error}
        </p>
      ) : null}

      <div
        ref={follow.ref}
        onScroll={follow.onScroll}
        className={`scrollbar-none relative flex min-h-0 flex-1 flex-col px-4 ${
          cinematic ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        {empty ? (
          <EmptyState
            icon={BookOpen01Icon}
            title="Your story has not begun"
            body="Describe what your character does and the world will answer."
          />
        ) : (
          <>
            <PlayScript
              turns={history}
              stream={stream}
              busy={busy}
              composingScene={compose.modeFor("turn.scene")}
              onComposeScene={composeScene}
            />
            <SceneStage
              phase={phase}
              stream={stream}
              turn={stageTurn}
              previous={previous}
              reveal={reveal}
              busy={busy}
              reduceMotion={reduceMotion}
              cinemaMode={cinemaMode}
              composingScene={compose.modeFor("turn.scene")}
              onComposeScene={composeScene}
              onEndCinematic={endCinematic}
            />
          </>
        )}
      </div>

      <div className="relative flex flex-col">
        <Composer
          choices={choices}
          busy={busy}
          composing={compose.modeFor("turn.action")}
          whisper={whisper}
          composingWhisper={compose.modeFor("turn.whisper")}
          cast={sheet.cast}
          isRerollingChoices={stream.isRerollingChoices}
          onWhisperChange={setWhisper}
          onComposeWhisper={composeWhisper}
          onSelectChoice={selectChoice}
          onSubmitAction={submitAction}
          onCompose={composeAction}
          onAbort={stream.abort}
          onRerollChoices={stageTurn ? () => stream.regenerate(stageTurn.id, "choices") : undefined}
        />
      </div>

      <AnimatePresence>
        {replaying === null ? null : (
          <ReplayOverlay
            key={stream.replayKey}
            turn={replaying}
            stream={stream}
            reduceMotion={reduceMotion}
            typing={immersive && !reduceMotion}
            onClose={stream.endReplay}
          />
        )}
      </AnimatePresence>

      <DiceOverlay
        check={stream.pendingCheck}
        label={sheet.labelOf(stream.pendingCheck?.stat ?? "")}
        onSettled={stream.acknowledgeDice}
      />

      <StoryMapModal
        visible={mapOpen}
        turns={stream.committedTurns}
        activeTurnId={stream.activeTurnId}
        onClose={() => setMapOpen(false)}
      />

      <DirectorConsoleModal
        visible={consoleOpen}
        worldId={sheet.worldId}
        onClose={() => setConsoleOpen(false)}
        statDefinitions={sheet.statDefinitions}
        stats={sheet.stats}
        affinities={{}}
        onApply={() => setConsoleOpen(false)}
        onSaveCheckpoint={(name) => void saveCheckpoint(name)}
      />
    </div>
  );
}
