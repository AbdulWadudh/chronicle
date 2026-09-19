import { Canvas, Circle, Group, RadialGradient, vec } from "@shopify/react-native-skia";
import { useWindowDimensions, View } from "react-native";
import { useThemeTokens } from "~/theme/ThemeEngine";

const TOP_ORB_SCALE = 0.95;
const LOWER_ORB_SCALE = 0.7;

export function GlowBackdrop() {
  const { width, height } = useWindowDimensions();
  const tokens = useThemeTokens();

  const topRadius = width * TOP_ORB_SCALE;
  const lowerRadius = width * LOWER_ORB_SCALE;

  return (
    <View pointerEvents="none" className="absolute inset-0">
      <Canvas style={{ width, height }}>
        <Group>
          <Circle cx={width * 0.5} cy={height * 0.16} r={topRadius}>
            <RadialGradient
              c={vec(width * 0.5, height * 0.16)}
              r={topRadius}
              colors={[`${tokens.primary}26`, `${tokens.primary}00`]}
            />
          </Circle>
          <Circle cx={width * 0.1} cy={height * 0.92} r={lowerRadius}>
            <RadialGradient
              c={vec(width * 0.1, height * 0.92)}
              r={lowerRadius}
              colors={[`${tokens.accent}1F`, `${tokens.accent}00`]}
            />
          </Circle>
        </Group>
      </Canvas>
    </View>
  );
}
