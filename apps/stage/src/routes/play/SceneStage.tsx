import type { ComposeMode, TurnNode } from "@chronicle/utils";
import { motion } from "motion/react";
import { NarrativeStream } from "~/components/story/NarrativeStream";
import type { SentenceReveal } from "~/components/story/useSentenceReveal";
import { useElementSize } from "~/hooks/useElementSize";
import type { PlayPhase, TurnStream } from "~/hooks/useTurnStream";
import { FullScreenSceneButton } from "./FullScreenSceneButton";
import { ReplaySceneButton } from "./ReplaySceneButton";
import { SceneFrame } from "./SceneFrame";
import { ScenePromptCard } from "./ScenePromptCard";
import { TurnActions } from "./TurnActions";
import { aspectOf, PlayerActionLine, TURN_GRID } from "./TurnEntry";

const FADE = { duration: 0.5, ease: "easeOut" } as const;
const DESKTOP_MIN_WIDTH = 768;
const STAGE_LABEL: Record<string, string> = {
  sketch: "Sketching the scene",
  detail: "Adding the fine detail",
};

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
  const revealing = cinematic && stream.replayRevealing && imageUrl !== null;
  const painting =
    revealing || (turn === null ? stream.sceneImageUrl === null : stream.isPainting(turn.id));
  const paintingId = turn?.id ?? stream.activeTurnId;
  const progress = paintingId === null ? null : stream.progressOf(paintingId);
  const shape = turn?.sceneShape ?? stream.sceneShape ?? previous?.sceneShape ?? "square";
  const aspect = aspectOf(shape);
  const measured = size.width > 0 && size.height > 0;
  const letterbox = size.width >= DESKTOP_MIN_WIDTH;
  const frameWidth = measured
    ? letterbox
      ? Math.min(size.width, size.height * aspect)
      : Math.max(size.width, size.height * aspect)
    : size.width;
  const frameStyle = {
    width: frameWidth,
    left: (size.width - frameWidth) / 2,
    top: (size.height - frameWidth / aspect) / 2,
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
      {cinematic && letterbox && imageUrl !== null ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl brightness-[0.45] saturate-125"
        />
      ) : null}
      <div
        style={cinematic ? frameStyle : undefined}
        className={cinematic ? "absolute" : "relative md:col-start-2 md:row-start-1"}
      >
        <SceneFrame
          imageUrl={revealing ? null : imageUrl}
          alt={turn === null ? "The scene being illustrated" : `Scene from ${turn.playerAction}`}
          aspect={aspect}
          painting={painting}
          percent={progress?.percent ?? null}
          stage={progress?.stage ?? null}
          preview={revealing ? imageUrl : (progress?.preview ?? null)}
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
            cinematic || turn === null ? undefined : painting ? (
              <FullScreenSceneButton busy={busy} onEnter={stream.enterCinematic} />
            ) : (
              <ReplaySceneButton turn={turn} busy={busy} onReplay={stream.replayTurn} />
            )
          }
        />
      </div>

      {cinematic ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-linear-to-t from-scrim to-transparent px-6 pt-20 pb-[max(1.5rem,var(--safe-bottom))]">
          {reveal.visible.length === 0 ? null : (
            <div className="pointer-events-auto w-full max-w-130 rounded-card border-(length:--border-width-card) border-primary/45 bg-card/30 px-4 py-2.5 backdrop-blur-xl">
              {narration}
            </div>
          )}
          {stream.sceneReady ? (
            <button
              type="button"
              onClick={onEndCinematic}
              className="pressable pointer-events-auto cursor-pointer rounded-control border-(length:--border-width-card) border-primary/50 bg-card/20 px-3.5 py-1.5 text-[0.6875rem] font-medium tracking-[0.12em] text-text-primary uppercase backdrop-blur-md transition-colors hover:border-primary/70 hover:bg-card/40"
            >
              {hint ?? "Tap to continue"}
            </button>
          ) : (
            <>
              <p className="flex items-baseline gap-2 text-[0.8125rem] text-text-primary">
                <span>
                  {progress === null
                    ? "Preparing the scene"
                    : (STAGE_LABEL[progress.stage] ?? "Painting the scene")}
                </span>
                {progress === null ? null : (
                  <span className="tabular-nums text-text-muted">{progress.percent}%</span>
                )}
              </p>
              <button
                type="button"
                onClick={onEndCinematic}
                className="pointer-events-auto cursor-pointer text-[0.6875rem] font-medium tracking-[0.12em] text-text-muted uppercase underline-offset-4 transition-colors hover:text-text-primary hover:underline motion-reduce:transition-none"
              >
                {hint ?? "Skip the wait"}
              </button>
            </>
          )}
        </div>
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
              canRewrite={!busy}
            />
          )}
        </div>
      )}
    </section>
  );
}
