import { Canvas, Circle, Group, RadialGradient, vec } from "@shopify/react-native-skia";
import { useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useThemeTokens } from "~/theme/ThemeEngine";

const TOP_ORB_SCALE = 0.8;
const LOWER_ORB_SCALE = 0.6;

export function GlowBackdrop() {
  const tokens = useThemeTokens();
  const [box, setBox] = useState({ width: 0, height: 0 });

  function measure(event: LayoutChangeEvent): void {
    const { width, height } = event.nativeEvent.layout;
    setBox({ width, height });
  }

  const topRadius = box.width * TOP_ORB_SCALE;
  const lowerRadius = box.width * LOWER_ORB_SCALE;

  return (
    <View
      onLayout={measure}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      className="overflow-hidden bg-canvas"
    >
      {box.width === 0 ? null : (
        <Canvas style={box}>
          <Group>
            <Circle cx={box.width * 0.5} cy={box.height * 0.12} r={topRadius}>
              <RadialGradient
                c={vec(box.width * 0.5, box.height * 0.12)}
                r={topRadius}
                colors={[`${tokens.primary}14`, `${tokens.primary}00`]}
              />
            </Circle>
            <Circle cx={box.width * 0.08} cy={box.height * 0.95} r={lowerRadius}>
              <RadialGradient
                c={vec(box.width * 0.08, box.height * 0.95)}
                r={lowerRadius}
                colors={[`${tokens.accent}12`, `${tokens.accent}00`]}
              />
            </Circle>
          </Group>
        </Canvas>
      )}
    </View>
  );
}
