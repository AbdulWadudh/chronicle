import type { ComposeMode, TurnNode } from "@chronicle/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { RefObject } from "react";
import type { TurnStream } from "~/hooks/useTurnStream";
import { useThemeStore } from "~/theme/store";
import { ReplaySceneButton } from "./ReplaySceneButton";
import { ScenePromptCard } from "./ScenePromptCard";
import { TurnActions } from "./TurnActions";
import { TurnEntry } from "./TurnEntry";

const ESTIMATED_TURN_HEIGHT = 620;
const OVERSCAN = 3;

export interface PlayScriptProps {
  scrollRef: RefObject<HTMLDivElement | null>;
  turns: readonly TurnNode[];
  stream: TurnStream;
  busy: boolean;
  composingScene: ComposeMode | null;
  onComposeScene: (turn: TurnNode, mode: ComposeMode, draft: string) => Promise<string | null>;
}

export function PlayScript({
  scrollRef,
  turns,
  stream,
  busy,
  composingScene,
  onComposeScene,
}: PlayScriptProps) {
  const historyActions = useThemeStore((state) => state.historyActions);
  const virtualizer = useVirtualizer({
    count: turns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_TURN_HEIGHT,
    getItemKey: (index) => turns[index]?.id ?? index,
    overscan: OVERSCAN,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  if (turns.length === 0) return null;

  return (
    <div
      style={{ height: virtualizer.getTotalSize() }}
      className="relative w-full max-w-170 shrink-0 self-center pt-5 pb-10"
    >
      {virtualizer.getVirtualItems().map((row) => {
        const turn = turns[row.index];
        if (turn === undefined) return null;
        return (
          <div
            key={turn.id}
            data-index={row.index}
            ref={virtualizer.measureElement}
            style={{ transform: `translateY(${row.start}px)` }}
            className="absolute top-0 left-0 w-full pb-8"
          >
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
              sceneCorner={
                <ReplaySceneButton turn={turn} busy={busy} onReplay={stream.replayTurn} />
              }
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
          </div>
        );
      })}
    </div>
  );
}
