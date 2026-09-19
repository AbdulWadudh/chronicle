import { useThemeTokens } from "~/theme/ThemeEngine";

const TOP_ORB = "80vw 80vw at 50% 12%";
const LOWER_ORB = "60vw 60vw at 8% 95%";

export function GlowBackdrop() {
  const tokens = useThemeTokens();
  const backgroundImage = [
    `radial-gradient(${TOP_ORB}, ${tokens.primary}14, transparent 70%)`,
    `radial-gradient(${LOWER_ORB}, ${tokens.accent}12, transparent 70%)`,
  ].join(", ");

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-canvas"
      style={{ backgroundImage }}
    />
  );
}
