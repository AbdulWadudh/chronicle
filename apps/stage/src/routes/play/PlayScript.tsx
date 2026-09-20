import type { ComposeMode, TurnNode } from "@chronicle/utils";
import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "~/components/common/EmptyState";
import { NarrativeStream } from "~/components/story/NarrativeStream";
import type { TurnStream } from "~/hooks/useTurnStream";
import { SceneFrame } from "./SceneFrame";
import { ScenePromptCard } from "./ScenePromptCard";
import { TurnActions } from "./TurnActions";
import { TurnEntry } from "./TurnEntry";

export interface PlayScriptProps {
  stream: TurnStream;
  aspect: number;
  busy: boolean;
  cinemaMode: boolean;
  composingScene: ComposeMode | null;
  onComposeScene: (turn: TurnNode, mode: ComposeMode, draft: string) => Promise<string | null>;
}

export function PlayScript({
  stream,
  aspect,
  busy,
  cinemaMode,
  composingScene,
  onComposeScene,
}: PlayScriptProps) {
  const latest = stream.committedTurns.at(-1);
  const streaming = stream.streamingText.length > 0;

  if (stream.committedTurns.length === 0 && !streaming) {
    return (
      <EmptyState
        icon={BookOpen01Icon}
        title="Your story has not begun"
        body="Describe what your character does and the world will answer."
      />
    );
  }

  return (
    <div className="flex w-full max-w-170 flex-col gap-8 self-center">
      {stream.committedTurns.map((turn) => (
        <TurnEntry
          key={turn.id}
          turn={turn}
          aspect={aspect}
          painting={stream.isPainting(turn.id)}
          percent={stream.progressOf(turn.id)}
          focal={turn.id === latest?.id}
          sceneActions={
            <ScenePromptCard
              seed={turn.narrativeText}
              busy={busy || stream.isPainting(turn.id)}
              composing={composingScene}
              onCompose={(mode, draft) => onComposeScene(turn, mode, draft)}
              onPaint={(prompt) => stream.repaintScene(turn.id, prompt)}
            />
          }
        >
          {turn.id === latest?.id ? (
            <TurnActions
              turn={turn}
              busy={busy}
              onReplayAudio={stream.replayAudio}
              onRegenerate={stream.regenerate}
            />
          ) : null}
        </TurnEntry>
      ))}

      {streaming ? (
        <article className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_17rem] md:items-start md:gap-6">
          <div className="md:col-start-2 md:row-start-1">
            <SceneFrame
              imageUrl={stream.sceneImageUrl}
              alt="The scene being illustrated"
              aspect={aspect}
              painting={stream.sceneImageUrl === null}
              percent={stream.activeTurnId === null ? null : stream.progressOf(stream.activeTurnId)}
            />
          </div>
          <div className="min-w-0 md:col-start-1 md:row-start-1">
            <NarrativeStream
              text={stream.streamingText}
              cinemaMode={cinemaMode}
              playingSentenceIndex={stream.playingSentenceIndex}
              onSkip={stream.skipAudio}
            />
          </div>
        </article>
      ) : null}
    </div>
  );
}
