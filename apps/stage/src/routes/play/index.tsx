import { API } from "@chronicle/config";
import type { ComposeMode, TurnNode } from "@chronicle/utils";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Composer } from "~/components/story/Composer";
import { DirectorConsoleModal } from "~/components/story/DirectorConsoleModal";
import { useFollowScroll } from "~/components/story/useFollowScroll";
import { useCharacterSheet } from "~/hooks/useCharacterSheet";
import { useCompose } from "~/hooks/useCompose";
import { useSceneAspect } from "~/hooks/useSceneShape";
import { useTurnStream } from "~/hooks/useTurnStream";
import { post } from "~/lib/api";
import { useThemeStore } from "~/theme/store";
import { DiceOverlay } from "./DiceOverlay";
import { PlayHeader } from "./PlayHeader";
import { PlayScript } from "./PlayScript";
import { SceneBackdrop } from "./SceneBackdrop";
import { StoryMapModal } from "./StoryMapModal";

export function Play() {
  const navigate = useNavigate();
  const { id = null } = useParams<{ id: string }>();
  const cinemaMode = useThemeStore((state) => state.cinemaMode);
  const setActiveStory = useThemeStore((state) => state.setActiveStory);

  const stream = useTurnStream(id, cinemaMode);
  const sheet = useCharacterSheet(id);
  const compose = useCompose();
  const aspect = useSceneAspect();
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

  function submitAction(action: string): void {
    stream.submitAction(action, whisper.trim().length > 0 ? whisper.trim() : null);
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
        className="scrollbar-none relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5"
      >
        <PlayScript
          stream={stream}
          aspect={aspect}
          busy={busy}
          cinemaMode={cinemaMode}
          composingScene={compose.modeFor("turn.scene")}
          onComposeScene={composeScene}
        />
      </div>

      <div className="relative flex flex-col">
        <Composer
          choices={latest?.choices ?? []}
          busy={busy}
          composing={compose.modeFor("turn.action")}
          whisper={whisper}
          composingWhisper={compose.modeFor("turn.whisper")}
          onWhisperChange={setWhisper}
          onComposeWhisper={composeWhisper}
          onSelectChoice={selectChoice}
          onSubmitAction={submitAction}
          onCompose={composeAction}
          onAbort={stream.abort}
        />
      </div>

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
