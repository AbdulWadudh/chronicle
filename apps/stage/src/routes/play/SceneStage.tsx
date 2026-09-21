import type { ComposeMode, TurnNode } from "@chronicle/utils";
import { motion } from "motion/react";
import { NarrativeStream } from "~/components/story/NarrativeStream";
import type { SentenceReveal } from "~/components/story/useSentenceReveal";
import { useElementSize } from "~/hooks/useElementSize";
import type { PlayPhase, TurnStream } from "~/hooks/useTurnStream";
import { ReplaySceneButton } from "./ReplaySceneButton";
import { SceneFrame } from "./SceneFrame";
import { ScenePromptCard } from "./ScenePromptCard";
import { TurnActions } from "./TurnActions";
import { aspectOf, PlayerActionLine, TURN_GRID } from "./TurnEntry";

const FADE = { duration: 0.5, ease: "easeOut" } as const;
const STAGE_LABEL = { sketch: "Sketching the scene", detail: "Adding the fine detail" } as const;

export interface SceneStageProps {
  phase: PlayPhase;
  stream: TurnStream;
  turn: TurnNode | null;
  previous: TurnNode | null;
  reveal: SentenceReveal;
  busy: boolean;
  cinemaMode: boolean;
  reduceMotion: boolean;
  composingScene: ComposeMode | null;
  onComposeScene: (turn: TurnNode, mode: ComposeMode, draft: string) => Promise<string | null>;
  onEndCinematic: () => void;
  layoutId?: string;
  hint?: string;
}

export function SceneStage({
  phase,
  stream,
  turn,
  previous,
  reveal,
  busy,
  cinemaMode,
  reduceMotion,
  composingScene,
  onComposeScene,
  onEndCinematic,
  layoutId = "scene-stage",
  hint,
}: SceneStageProps) {
  const [stageRef, size] = useElementSize<HTMLElement>();
  const cinematic = phase === "cinematic";

  const imageUrl = turn === null ? stream.sceneImageUrl : turn.sceneImageUrl;
  const painting = turn === null ? stream.sceneImageUrl === null : stream.isPainting(turn.id);
  const paintingId = turn?.id ?? stream.activeTurnId;
  const progress = paintingId === null ? null : stream.progressOf(paintingId);
  const shape = turn?.sceneShape ?? stream.sceneShape ?? previous?.sceneShape ?? "square";
  const aspect = aspectOf(shape);
  const measured = size.width > 0 && size.height > 0;
  const coverWidth = measured ? Math.max(size.width, size.height * aspect) : size.width;
  const coverStyle = {
    width: coverWidth,
    left: (size.width - coverWidth) / 2,
    top: (size.height - coverWidth / aspect) / 2,
  };

  function skipCinematic(): void {
    stream.skipAudio();
    onEndCinematic();
  }

  const narration = (
    <motion.div
      key={phase}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={FADE}
    >
      <NarrativeStream
        reveal={reveal}
        cinemaMode={cinemaMode}
        playingSentenceIndex={stream.playingSentenceIndex}
        caption={cinematic}
        onSkip={cinematic ? skipCinematic : stream.skipAudio}
      />
    </motion.div>
  );

  return (
    <section
      ref={stageRef}
      aria-label="Current scene"
      className={
        cinematic
          ? "fixed inset-0 z-30 overflow-hidden bg-canvas"
          : `${TURN_GRID} min-h-full w-full max-w-170 shrink-0 content-center self-center py-5`
      }
    >
      <div
        style={cinematic ? coverStyle : undefined}
        className={cinematic ? "absolute" : "relative md:col-start-2 md:row-start-1"}
      >
        <SceneFrame
          imageUrl={imageUrl}
          alt={turn === null ? "The scene being illustrated" : `Scene from ${turn.playerAction}`}
          aspect={aspect}
          painting={painting}
          percent={progress?.percent ?? null}
          layoutId={layoutId}
          animateLayout={!reduceMotion}
          drift={cinematic}
          actions={
            cinematic || turn === null ? undefined : (
              <ScenePromptCard
                seed={turn.narrativeText}
                busy={busy || painting}
                composing={composingScene}
                onCompose={(mode, draft) => onComposeScene(turn, mode, draft)}
                onPaint={(prompt) => stream.repaintScene(turn.id, prompt)}
              />
            )
          }
          corner={
            cinematic || turn === null ? undefined : (
              <ReplaySceneButton turn={turn} busy={busy} onReplay={stream.replayTurn} />
            )
          }
        />
      </div>

      {cinematic ? (
        <>
          <button
            type="button"
            onClick={onEndCinematic}
            aria-label="Continue to your choices"
            className="absolute inset-0 cursor-pointer"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-linear-to-t from-scrim to-transparent px-6 pt-20 pb-[max(1.5rem,var(--safe-bottom))]">
            {reveal.visible.length === 0 ? null : (
              <div className="w-full max-w-130 rounded-card border-(length:--border-width-card) border-primary/40 bg-card/80 px-5 py-4 shadow-(--shadow-overlay) backdrop-blur-md">
                {narration}
              </div>
            )}
            <p className="rounded-control bg-card/70 px-3 py-1 text-[0.6875rem] tracking-[0.12em] text-text-secondary uppercase backdrop-blur-sm">
              {hint ?? (stream.sceneReady ? "Tap to continue" : "Tap to skip the wait")}
            </p>
            {stream.sceneReady ? null : (
              <p className="text-[0.75rem] text-text-secondary italic">
                {progress === null ? "Preparing the scene…" : `${STAGE_LABEL[progress.stage]}…`}
                {progress === null ? null : (
                  <span className="ml-2 tabular-nums text-text-accent not-italic">
                    {progress.percent}%
                  </span>
                )}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="flex min-w-0 flex-col gap-3 md:col-start-1 md:row-start-1">
          {turn === null ? null : <PlayerActionLine action={turn.playerAction} focal />}
          {narration}
          {turn === null ? null : (
            <TurnActions
              turn={turn}
              busy={busy}
              onReplayAudio={stream.replayAudio}
              onRegenerate={stream.regenerate}
              canRewrite
            />
          )}
        </div>
      )}
    </section>
  );
}
