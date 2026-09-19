import { API } from "@chronicle/shared";
import { ChevronLeft, ScrollText, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { EmptyState } from "~/components/common/EmptyState";
import { Spinner } from "~/components/common/Spinner";
import { Composer } from "~/components/story/Composer";
import { DirectorConsoleModal } from "~/components/story/DirectorConsoleModal";
import { NarrativeStream } from "~/components/story/NarrativeStream";
import { ScenePanel, type ScenePanelTab } from "~/components/story/ScenePanel";
import { useFollowScroll } from "~/components/story/useFollowScroll";
import { useCharacterSheet } from "~/hooks/useCharacterSheet";
import { useResponsiveLayout } from "~/hooks/useResponsiveLayout";
import { useTurnStream } from "~/hooks/useTurnStream";
import { post } from "~/lib/api";
import { useThemeStore } from "~/theme/store";
import { useThemeTokens } from "~/theme/ThemeEngine";

const DiceRoller3D = lazy(async () => {
  const module = await import("~/components/canvas/dice");
  return { default: module.DiceRoller3D };
});

const IDLE_STATUS = { label: "Idle", dot: "bg-text-muted" };

const STATUS: Record<string, { label: string; dot: string }> = {
  idle: IDLE_STATUS,
  connecting: { label: "Connecting", dot: "bg-warning" },
  open: { label: "Live", dot: "bg-success" },
  closed: { label: "Reconnecting", dot: "bg-danger" },
};

const DICE_SIZE = 190;
const PANEL_ASPECT = 0.62;
const PANEL_HEIGHT_RATIO = 0.32;
const PANEL_TABS_HEIGHT = 44;

export function Play() {
  const navigate = useNavigate();
  const tokens = useThemeTokens();
  const { id = null } = useParams<{ id: string }>();
  const layout = useResponsiveLayout();
  const cinemaMode = useThemeStore((state) => state.cinemaMode);
  const setActiveStory = useThemeStore((state) => state.setActiveStory);

  const stream = useTurnStream(id, cinemaMode);
  const sheet = useCharacterSheet(id);
  const [tab, setTab] = useState<ScenePanelTab>("scene");
  const [consoleOpen, setConsoleOpen] = useState(false);
  const follow = useFollowScroll();

  useEffect(() => {
    setActiveStory(id);
    return () => setActiveStory(null);
  }, [id, setActiveStory]);

  const latest = stream.committedTurns.at(-1);
  const streaming = stream.streamingText.length > 0;
  const busy = stream.activeTurnId !== null;
  const status = STATUS[stream.status] ?? IDLE_STATUS;
  const hasScene = stream.sceneImageUrl !== null || stream.committedTurns.length > 0;
  const panelWidth = (layout.isSplit ? layout.canvasWidth : layout.width) - 32;
  const stackedPanelHeight = Math.round(
    Math.min(panelWidth * PANEL_ASPECT, layout.height * PANEL_HEIGHT_RATIO),
  );
  const panelHeight = layout.isSplit ? layout.height - 180 : stackedPanelHeight;

  async function saveCheckpoint(name: string): Promise<void> {
    if (latest === undefined) return;
    await post(`${API.turns}/checkpoints`, { turnId: latest.id, name });
  }

  const scenePanel = (
    <ScenePanel
      tab={tab}
      onTabChange={setTab}
      imageUrl={stream.sceneImageUrl}
      turns={stream.committedTurns}
      activeTurnId={stream.activeTurnId}
      width={panelWidth}
      height={panelHeight}
    />
  );

  return (
    <div className="flex h-full flex-col bg-canvas pt-[var(--safe-top)] pb-[var(--safe-bottom)]">
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
        <button
          type="button"
          onClick={() => void navigate(-1)}
          aria-label="Back"
          className="flex h-9 items-center gap-1 rounded-full px-2 text-[13px] text-text-muted"
        >
          <ChevronLeft size={18} strokeWidth={1.5} color={tokens.textMuted} />
          Back
        </button>

        <p className="flex items-center gap-2 text-[12px] text-text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </p>

        <button
          type="button"
          onClick={() => setConsoleOpen(true)}
          aria-label="Open director console"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-text-accent"
        >
          <SlidersHorizontal size={16} strokeWidth={1.5} />
        </button>
      </header>

      {stream.error !== null ? (
        <p
          role="alert"
          className="shrink-0 border-b border-danger/20 bg-danger/10 px-4 py-2 text-[13px] text-danger"
        >
          {stream.error}
        </p>
      ) : null}

      <div className={`flex min-h-0 flex-1 ${layout.isSplit ? "flex-row" : "flex-col"}`}>
        {layout.isSplit || !hasScene ? null : (
          <div
            className="shrink-0 px-4 pt-3"
            style={{ height: stackedPanelHeight + PANEL_TABS_HEIGHT }}
          >
            {scenePanel}
          </div>
        )}

        <div className={`flex min-h-0 flex-col ${layout.isSplit ? "flex-[55]" : "flex-1"}`}>
          <div
            ref={follow.ref}
            onScroll={follow.onScroll}
            className="scrollbar-none flex flex-1 flex-col gap-6 overflow-y-auto p-4"
          >
            {stream.committedTurns.length === 0 && !streaming ? (
              <EmptyState
                icon={ScrollText}
                title="Your story has not begun"
                body="Describe what your character does and the world will answer."
              />
            ) : (
              <div className="flex w-full max-w-[680px] flex-col gap-6 self-center">
                {stream.committedTurns.map((turn) => (
                  <article key={turn.id} className="flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-4 w-[2px] shrink-0 rounded-full bg-primary/70" />
                      <p className="flex-1 text-[14px] italic leading-snug text-text-muted">
                        {turn.playerAction}
                      </p>
                    </div>
                    <p className="text-[16px] leading-7 text-text-secondary">
                      {turn.narrativeText}
                    </p>
                  </article>
                ))}
                {streaming ? (
                  <NarrativeStream
                    text={stream.streamingText}
                    cinemaMode={cinemaMode}
                    playingSentenceIndex={stream.playingSentenceIndex}
                    onSkip={stream.skipAudio}
                  />
                ) : null}
              </div>
            )}

            {stream.pendingCheck !== null ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col items-center gap-2 py-2"
              >
                <p className="text-[12px] uppercase tracking-[0.14em] text-text-muted">
                  {stream.pendingCheck.stat} · DC {stream.pendingCheck.dc}
                </p>
                <Suspense fallback={<Spinner size={28} label="Rolling" />}>
                  <DiceRoller3D
                    roll={stream.pendingCheck.roll}
                    size={DICE_SIZE}
                    onSettled={stream.acknowledgeDice}
                  />
                </Suspense>
              </motion.div>
            ) : null}
          </div>

          <Composer
            choices={latest?.choices ?? []}
            busy={busy}
            onSelectChoice={stream.selectChoice}
            onSubmitAction={stream.submitAction}
            onAbort={stream.abort}
          />
        </div>

        {layout.isSplit ? (
          <div className="flex min-h-0 flex-[45] flex-col border-l border-white/[0.06] p-4">
            {scenePanel}
          </div>
        ) : null}
      </div>

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
