import type { TurnNode } from "@chronicle/shared";
import {
  Canvas,
  DashPathEffect,
  Group,
  Path,
  RoundedRect,
  Skia,
  Text as SkiaText,
  useFont,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { useThemeTokens } from "~/theme/ThemeEngine";
import { edgesOf, layoutGraph, NODE_HEIGHT, NODE_WIDTH, splinePath } from "./layout";

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const LABEL_SIZE = 12;
const LABEL_LIMIT = 22;

export interface FlowchartCanvasProps {
  turns: readonly TurnNode[];
  activeTurnId: string | null;
  width: number;
  height: number;
}

export function FlowchartCanvas({ turns, activeTurnId, width, height }: FlowchartCanvasProps) {
  const tokens = useThemeTokens();
  const font = useFont(null, LABEL_SIZE);

  const translateX = useSharedValue(24);
  const translateY = useSharedValue(24);
  const scale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);

  const graph = useMemo(() => layoutGraph(turns, activeTurnId), [turns, activeTurnId]);
  const edges = useMemo(() => edgesOf(graph), [graph]);
  const paths = useMemo(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        failed: edge.failed,
        path: Skia.Path.MakeFromSVGString(splinePath(edge)),
      })),
    [edges],
  );

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(startScale.value * event.scale, MIN_SCALE), MAX_SCALE);
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const transform = useDerivedValue(() => [
    { translateX: translateX.value },
    { translateY: translateY.value },
    { scale: scale.value },
  ]);

  return (
    <View style={{ width, height }} className="overflow-hidden rounded-2xl bg-canvas">
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          <Group transform={transform}>
            {paths.map((entry) =>
              entry.path === null ? null : (
                <Path
                  key={entry.id}
                  path={entry.path}
                  style="stroke"
                  strokeWidth={entry.failed ? 2 : 1.5}
                  color={entry.failed ? tokens.danger : tokens.cardBorder}
                >
                  {entry.failed ? <DashPathEffect intervals={[7, 6]} /> : null}
                </Path>
              ),
            )}

            {graph.nodes.map((node) => (
              <Group key={node.id}>
                <RoundedRect
                  x={node.x}
                  y={node.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  r={tokens.radius}
                  color={node.state === "active" ? tokens.cardGlow : tokens.card}
                />
                <RoundedRect
                  x={node.x}
                  y={node.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  r={tokens.radius}
                  style="stroke"
                  strokeWidth={tokens.borderWidth}
                  color={
                    node.state === "success"
                      ? tokens.success
                      : node.state === "failure"
                        ? tokens.danger
                        : tokens.cardBorder
                  }
                />
                {font === null ? null : (
                  <SkiaText
                    x={node.x + 12}
                    y={node.y + NODE_HEIGHT / 2}
                    text={node.label.slice(0, LABEL_LIMIT)}
                    font={font}
                    color={tokens.textPrimary}
                  />
                )}
              </Group>
            ))}
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  );
}
