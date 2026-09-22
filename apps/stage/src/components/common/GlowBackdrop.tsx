import { useThemeTokens } from "~/theme/ThemeEngine";

const TOP_ORB = "80vw 80vw at 50% 10%";

export function GlowBackdrop() {
  const tokens = useThemeTokens();
  const backgroundImage = `radial-gradient(${TOP_ORB}, ${tokens.primary}14, transparent 68%)`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-canvas"
      style={{ backgroundImage }}
    />
  );
}
