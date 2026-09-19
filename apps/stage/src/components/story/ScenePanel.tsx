import type { TurnNode } from "@chronicle/shared";
import { ImageOff, Network } from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { FlowchartCanvas } from "~/components/canvas/flowchart/FlowchartCanvas";
import { EmptyState } from "~/components/common/EmptyState";

export type ScenePanelTab = "scene" | "map";

export interface ScenePanelProps {
  tab: ScenePanelTab;
  onTabChange: (tab: ScenePanelTab) => void;
  imageUrl: string | null;
  turns: readonly TurnNode[];
  activeTurnId: string | null;
  width: number;
  height: number;
}

const TABS: { key: ScenePanelTab; label: string }[] = [
  { key: "scene", label: "Scene" },
  { key: "map", label: "Story map" },
];

export function ScenePanel({
  tab,
  onTabChange,
  imageUrl,
  turns,
  activeTurnId,
  width,
  height,
}: ScenePanelProps) {
  return (
    <View className="flex-1 gap-3">
      <View className="flex-row gap-1.5">
        {TABS.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => onTabChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === option.key }}
            className={`h-8 justify-center rounded-full px-3.5 ${
              tab === option.key ? "bg-primary" : "border border-white/[0.06] bg-white/[0.02]"
            }`}
          >
            <Text
              className={`text-[12px] font-medium ${
                tab === option.key ? "text-primary-foreground" : "text-text-muted"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-1 overflow-hidden rounded-[22px] border border-white/[0.06] bg-card">
        {tab === "map" ? (
          turns.length === 0 ? (
            <EmptyState
              icon={Network}
              title="No branches yet"
              body="Every choice you make adds a node here. Take your first action to begin the map."
            />
          ) : (
            <FlowchartCanvas
              turns={turns}
              activeTurnId={activeTurnId}
              width={width}
              height={height}
            />
          )
        ) : imageUrl === null ? (
          <EmptyState
            icon={ImageOff}
            title="No scene yet"
            body="The first illustration appears once your opening turn finishes rendering."
          />
        ) : (
          <Animated.View entering={FadeIn.duration(320)} className="flex-1">
            <Image
              source={{ uri: imageUrl }}
              className="h-full w-full"
              resizeMode="cover"
              accessibilityLabel="Current scene illustration"
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}
