import { API } from "@chronicle/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { DiceRoller3D } from "~/components/canvas/dice/DiceRoller3D";
import { FlowchartCanvas } from "~/components/canvas/flowchart/FlowchartCanvas";
import { ChoicePills } from "~/components/story/ChoicePills";
import { DirectorConsoleModal } from "~/components/story/DirectorConsoleModal";
import { NarrativeStream } from "~/components/story/NarrativeStream";
import { useResponsiveLayout } from "~/hooks/useResponsiveLayout";
import { useTurnStream } from "~/hooks/useTurnStream";
import { post } from "~/lib/api";
import { useThemeStore } from "~/theme/store";

const STATUS_LABEL: Record<string, string> = {
  idle: "Idle",
  connecting: "Connecting…",
  open: "Live",
  closed: "Reconnecting…",
};

const SCROLL_STYLE = { gap: 16, paddingBottom: 24 } as const;
const DICE_SIZE = 200;
const STACKED_PANEL_HEIGHT = 240;
const SPLIT_PANEL_INSET = 140;

type Panel = "scene" | "map";

export default function PlayScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const layout = useResponsiveLayout();
  const cinemaMode = useThemeStore((state) => state.cinemaMode);
  const setActiveStory = useThemeStore((state) => state.setActiveStory);

  const stream = useTurnStream(id ?? null, cinemaMode);
  const [panel, setPanel] = useState<Panel>("scene");
  const [consoleOpen, setConsoleOpen] = useState(false);

  useEffect(() => {
    setActiveStory(id ?? null);
    return () => setActiveStory(null);
  }, [id, setActiveStory]);

  const latest = stream.committedTurns.at(-1);
  const narrative =
    stream.streamingText.length > 0 ? stream.streamingText : (latest?.narrativeText ?? "");
  const busy = stream.activeTurnId !== null;
  const panelWidth = (layout.isSplit ? layout.canvasWidth : layout.width) - 24;
  const panelHeight = layout.isSplit ? layout.height - SPLIT_PANEL_INSET : STACKED_PANEL_HEIGHT;

  async function saveCheckpoint(name: string): Promise<void> {
    if (latest === undefined) return;
    await post(`${API.turns}/checkpoints`, { turnId: latest.id, name });
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
          <Text className="text-text-muted">← Back</Text>
        </Pressable>
        <Text className="text-sm text-text-muted">
          {STATUS_LABEL[stream.status] ?? stream.status}
        </Text>
        <Pressable onPress={() => setConsoleOpen(true)} hitSlop={8} accessibilityRole="button">
          <Text className="text-text-accent">Director</Text>
        </Pressable>
      </View>

      {stream.error !== null ? (
        <Text className="px-4 pb-2 text-sm text-danger">{stream.error}</Text>
      ) : null}

      <View className={layout.isSplit ? "flex-1 flex-row gap-3 p-3" : "flex-1 gap-3 p-3"}>
        <ScrollView
          className={layout.isSplit ? "flex-[55]" : "flex-1"}
          contentContainerStyle={SCROLL_STYLE}
        >
          <NarrativeStream
            text={narrative}
            cinemaMode={cinemaMode}
            playingSentenceIndex={stream.playingSentenceIndex}
            onSkip={stream.skipAudio}
          />

          {stream.pendingCheck !== null ? (
            <Animated.View entering={FadeIn.duration(200)} className="items-center gap-2">
              <Text className="text-text-secondary">
                {stream.pendingCheck.stat} check — DC {stream.pendingCheck.dc}
              </Text>
              <DiceRoller3D
                roll={stream.pendingCheck.roll}
                size={DICE_SIZE}
                onSettled={stream.acknowledgeDice}
              />
            </Animated.View>
          ) : null}

          {busy ? (
            <Pressable
              onPress={stream.abort}
              accessibilityRole="button"
              className="self-start rounded-xl bg-secondary px-4 py-2 active:opacity-80"
            >
              <Text className="text-secondary-foreground">Stop</Text>
            </Pressable>
          ) : null}

          <ChoicePills
            choices={latest?.choices ?? []}
            disabled={busy}
            onSelectChoice={stream.selectChoice}
            onSubmitAction={stream.submitAction}
          />
        </ScrollView>

        <View className={layout.isSplit ? "flex-[45] gap-2" : "gap-2"}>
          <View className="flex-row gap-2">
            {(["scene", "map"] as Panel[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => setPanel(option)}
                accessibilityRole="tab"
                accessibilityState={{ selected: panel === option }}
                className={`rounded-full px-3 py-1.5 ${panel === option ? "bg-primary" : "bg-secondary"}`}
              >
                <Text
                  className={`text-xs ${panel === option ? "text-primary-foreground" : "text-secondary-foreground"}`}
                >
                  {option === "scene" ? "Scene" : "Map"}
                </Text>
              </Pressable>
            ))}
          </View>

          {panel === "map" ? (
            <FlowchartCanvas
              turns={stream.committedTurns}
              activeTurnId={stream.activeTurnId}
              width={panelWidth}
              height={panelHeight}
            />
          ) : (
            <View
              style={{ height: panelHeight }}
              className="items-center justify-center overflow-hidden rounded-2xl border border-card-border bg-card"
            >
              {stream.sceneImageUrl === null ? (
                <Text className="text-text-muted">The scene has not been rendered yet.</Text>
              ) : (
                <Animated.Image
                  entering={FadeIn.duration(280)}
                  source={{ uri: stream.sceneImageUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              )}
            </View>
          )}
        </View>
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
    </SafeAreaView>
  );
}
