import type { ComposeMode, TurnNode } from "@chronicle/utils";
import type { TurnStream } from "~/hooks/useTurnStream";
import { useThemeStore } from "~/theme/store";
import { ReplaySceneButton } from "./ReplaySceneButton";
import { ScenePromptCard } from "./ScenePromptCard";
import { TurnActions } from "./TurnActions";
import { TurnEntry } from "./TurnEntry";

export interface PlayScriptProps {
  turns: readonly TurnNode[];
  stream: TurnStream;
  busy: boolean;
  composingScene: ComposeMode | null;
  onComposeScene: (turn: TurnNode, mode: ComposeMode, draft: string) => Promise<string | null>;
}

export function PlayScript({
  turns,
  stream,
  busy,
  composingScene,
  onComposeScene,
}: PlayScriptProps) {
  const historyActions = useThemeStore((state) => state.historyActions);
  if (turns.length === 0) return null;

  return (
    <div className="flex w-full max-w-170 flex-col gap-8 self-center pt-5 pb-10">
      {turns.map((turn) => (
        <TurnEntry
          key={turn.id}
          turn={turn}
          painting={stream.isPainting(turn.id)}
          percent={stream.progressOf(turn.id)?.percent ?? null}
          focal={false}
          sceneActions={
            <ScenePromptCard
              seed={turn.narrativeText}
              busy={busy || stream.isPainting(turn.id)}
              composing={composingScene}
              onCompose={(mode, draft) => onComposeScene(turn, mode, draft)}
              onPaint={(prompt) => stream.repaintScene(turn.id, prompt)}
            />
          }
          sceneCorner={<ReplaySceneButton turn={turn} busy={busy} onReplay={stream.replayTurn} />}
        >
          {historyActions ? (
            <TurnActions
              turn={turn}
              busy={busy}
              onReplayAudio={stream.replayAudio}
              onRegenerate={stream.regenerate}
              canRewrite={false}
            />
          ) : null}
        </TurnEntry>
      ))}
    </div>
  );
}
