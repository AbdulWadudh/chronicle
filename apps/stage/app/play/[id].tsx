import { API } from "@chronicle/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ScrollText, SlidersHorizontal } from "lucide-react-native";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { DiceRoller3D } from "~/components/canvas/dice/DiceRoller3D";
import { EmptyState } from "~/components/common/EmptyState";
import { Composer } from "~/components/story/Composer";
import { DirectorConsoleModal } from "~/components/story/DirectorConsoleModal";
import { NarrativeStream } from "~/components/story/NarrativeStream";
import { ScenePanel, type ScenePanelTab } from "~/components/story/ScenePanel";
import { useFollowScroll } from "~/components/story/useFollowScroll";
import { useResponsiveLayout } from "~/hooks/useResponsiveLayout";
import { useTurnStream } from "~/hooks/useTurnStream";
import { post } from "~/lib/api";
import { useThemeStore } from "~/theme/store";
import { useThemeTokens } from "~/theme/ThemeEngine";

const IDLE_STATUS = { label: "Idle", dot: "bg-text-muted" };

const STATUS: Record<string, { label: string; dot: string }> = {
  idle: { label: "Idle", dot: "bg-text-muted" },
  connecting: { label: "Connecting", dot: "bg-warning" },
  open: { label: "Live", dot: "bg-success" },
  closed: { label: "Reconnecting", dot: "bg-danger" },
};

const TRANSCRIPT_STYLE = { padding: 16, gap: 24, flexGrow: 1 } as const;
const READING_WIDTH = { width: "100%", maxWidth: 680 } as const;
const DICE_SIZE = 190;
const PANEL_ASPECT = 0.62;
const PANEL_HEIGHT_RATIO = 0.32;
const PANEL_TABS_HEIGHT = 44;

const FILL = { flex: 1 } as const;
export default function PlayScreen() {
  const router = useRouter();
  const tokens = useThemeTokens();
  const { id } = useLocalSearchParams<{ id: string }>();
  const layout = useResponsiveLayout();
  const cinemaMode = useThemeStore((state) => state.cinemaMode);
  const setActiveStory = useThemeStore((state) => state.setActiveStory);

  const stream = useTurnStream(id ?? null, cinemaMode);
  const [tab, setTab] = useState<ScenePanelTab>("scene");
  const [consoleOpen, setConsoleOpen] = useState(false);
  const follow = useFollowScroll();

  useEffect(() => {
    setActiveStory(id ?? null);
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

  const transcript = (
    <ScrollView
      ref={follow.ref}
      onScroll={follow.onScroll}
      onContentSizeChange={follow.onContentSizeChange}
      scrollEventThrottle={16}
      className="flex-1"
      contentContainerStyle={TRANSCRIPT_STYLE}
      showsVerticalScrollIndicator={false}
    >
      {stream.committedTurns.length === 0 && !streaming ? (
        <EmptyState
          icon={ScrollText}
          title="Your story has not begun"
          body="Describe what your character does and the world will answer."
        />
      ) : (
        <View style={READING_WIDTH} className="gap-6 self-center">
          {stream.committedTurns.map((turn) => (
            <View key={turn.id} className="gap-3">
              <View className="flex-row items-start gap-2.5">
                <View className="mt-1.5 h-4 w-[2px] rounded-full bg-primary/70" />
                <Text className="flex-1 text-[14px] italic leading-snug text-text-muted">
                  {turn.playerAction}
                </Text>
              </View>
              <Text className="text-[16px] leading-7 text-text-secondary">
                {turn.narrativeText}
              </Text>
            </View>
          ))}
          {streaming ? (
            <NarrativeStream
              text={stream.streamingText}
              cinemaMode={cinemaMode}
              playingSentenceIndex={stream.playingSentenceIndex}
              onSkip={stream.skipAudio}
            />
          ) : null}
        </View>
      )}

      {stream.pendingCheck !== null ? (
        <Animated.View entering={FadeIn.duration(220)} className="items-center gap-2 py-2">
          <Text className="text-[12px] uppercase tracking-[0.14em] text-text-muted">
            {stream.pendingCheck.stat} · DC {stream.pendingCheck.dc}
          </Text>
          <DiceRoller3D
            roll={stream.pendingCheck.roll}
            size={DICE_SIZE}
            onSettled={stream.acknowledgeDice}
          />
        </Animated.View>
      ) : null}
    </ScrollView>
  );

  return (
    <SafeAreaView style={FILL} className="bg-canvas">
      <KeyboardAvoidingView style={FILL} behavior="padding">
        <View className="flex-row items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="h-9 flex-row items-center gap-1 rounded-full px-2 active:opacity-70"
          >
            <ChevronLeft size={18} strokeWidth={1.5} color={tokens.textMuted} />
            <Text className="text-[13px] text-text-muted">Back</Text>
          </Pressable>

          <View className="flex-row items-center gap-2">
            <View className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            <Text className="text-[12px] text-text-muted">{status.label}</Text>
          </View>

          <Pressable
            onPress={() => setConsoleOpen(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Open director console"
            className="h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] active:opacity-70"
          >
            <SlidersHorizontal size={16} strokeWidth={1.5} color={tokens.textAccent} />
          </Pressable>
        </View>

        {stream.error !== null ? (
          <View className="border-b border-danger/20 bg-danger/10 px-4 py-2">
            <Text className="text-[13px] text-danger">{stream.error}</Text>
          </View>
        ) : null}

        <View className={layout.isSplit ? "flex-1 flex-row" : "flex-1"}>
          {layout.isSplit || !hasScene ? null : (
            <View className="px-4 pt-3" style={{ height: stackedPanelHeight + PANEL_TABS_HEIGHT }}>
              <ScenePanel
                tab={tab}
                onTabChange={setTab}
                imageUrl={stream.sceneImageUrl}
                turns={stream.committedTurns}
                activeTurnId={stream.activeTurnId}
                width={panelWidth}
                height={panelHeight}
              />
            </View>
          )}

          <View className={layout.isSplit ? "flex-[55]" : "flex-1"}>
            {transcript}
            <Composer
              choices={latest?.choices ?? []}
              busy={busy}
              onSelectChoice={stream.selectChoice}
              onSubmitAction={stream.submitAction}
              onAbort={stream.abort}
            />
          </View>

          {layout.isSplit ? (
            <View className="flex-[45] border-l border-white/[0.06] p-4">
              <ScenePanel
                tab={tab}
                onTabChange={setTab}
                imageUrl={stream.sceneImageUrl}
                turns={stream.committedTurns}
                activeTurnId={stream.activeTurnId}
                width={panelWidth}
                height={panelHeight}
              />
            </View>
          ) : null}
        </View>

        <DirectorConsoleModal
          visible={consoleOpen}
          onClose={() => setConsoleOpen(false)}
          statDefinitions={[]}
          stats={{}}
          affinities={{}}
          onApply={() => setConsoleOpen(false)}
          onSaveCheckpoint={(name) => void saveCheckpoint(name)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
