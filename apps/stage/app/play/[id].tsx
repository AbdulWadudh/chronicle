import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResponsiveLayout } from "~/hooks/useResponsiveLayout";
import { useTurnStream } from "~/hooks/useTurnStream";
import { useThemeStore } from "~/theme/store";

const STATUS_LABEL: Record<string, string> = {
  idle: "Idle",
  connecting: "Connecting…",
  open: "Live",
  closed: "Reconnecting…",
};

function ScenePanel({ imageUrl }: { imageUrl: string | null }) {
  return (
    <View className="flex-1 items-center justify-center rounded-2xl border border-card-border bg-card">
      {imageUrl === null ? (
        <Text className="text-text-muted">The scene has not been rendered yet.</Text>
      ) : (
        <Animated.View entering={FadeIn.duration(280)} className="h-full w-full">
          <Image
            source={{ uri: imageUrl }}
            className="h-full w-full rounded-2xl"
            resizeMode="cover"
          />
        </Animated.View>
      )}
    </View>
  );
}

const SCROLL_STYLE = { gap: 16, paddingBottom: 24 } as const;

export default function PlayScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const layout = useResponsiveLayout();
  const cinemaMode = useThemeStore((state) => state.cinemaMode);
  const setActiveStory = useThemeStore((state) => state.setActiveStory);

  const stream = useTurnStream(id ?? null, cinemaMode);

  useEffect(() => {
    setActiveStory(id ?? null);
    return () => setActiveStory(null);
  }, [id, setActiveStory]);

  const narrative =
    stream.streamingText.length > 0
      ? stream.streamingText
      : (stream.committedTurns.at(-1)?.narrativeText ?? "Your story begins here.");

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
          <Text className="text-text-muted">← Back</Text>
        </Pressable>
        <Text className="text-sm text-text-muted">
          {STATUS_LABEL[stream.status] ?? stream.status}
        </Text>
      </View>

      {stream.error !== null ? (
        <Text className="px-4 pb-2 text-sm text-danger">{stream.error}</Text>
      ) : null}

      <View className={layout.isSplit ? "flex-1 flex-row gap-3 p-3" : "flex-1 gap-3 p-3"}>
        <ScrollView
          className={layout.isSplit ? "flex-[55]" : "flex-1"}
          contentContainerStyle={SCROLL_STYLE}
        >
          <Pressable onPress={stream.skipAudio} accessibilityRole="button">
            <View className="rounded-2xl border border-card-border bg-card p-5">
              <Text className="text-base leading-7 text-text-primary">{narrative}</Text>
            </View>
          </Pressable>

          {stream.pendingCheck !== null ? (
            <Pressable
              onPress={stream.acknowledgeDice}
              accessibilityRole="button"
              className="rounded-2xl border border-card-border bg-card p-4"
            >
              <Text className="text-text-primary">
                {stream.pendingCheck.stat} check — rolled {stream.pendingCheck.roll} vs DC{" "}
                {stream.pendingCheck.dc}
              </Text>
              <Text className={stream.pendingCheck.succeeded ? "text-success" : "text-danger"}>
                {stream.pendingCheck.succeeded ? "Success" : "Failure"} — tap to continue
              </Text>
            </Pressable>
          ) : null}

          {stream.activeTurnId !== null ? (
            <Pressable
              onPress={stream.abort}
              accessibilityRole="button"
              className="self-start rounded-xl bg-secondary px-4 py-2 active:opacity-80"
            >
              <Text className="text-secondary-foreground">Stop</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => stream.submitAction("Look around.", "scratch")}
            accessibilityRole="button"
            className="rounded-xl bg-primary px-4 py-3 active:opacity-85"
          >
            <Text className="text-center font-medium text-primary-foreground">Look around</Text>
          </Pressable>
        </ScrollView>

        <View className={layout.isSplit ? "flex-[45]" : "h-56"}>
          <ScenePanel imageUrl={stream.sceneImageUrl} />
        </View>
      </View>
    </SafeAreaView>
  );
}
