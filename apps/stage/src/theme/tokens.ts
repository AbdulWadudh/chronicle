import type { ThemeTokens } from "@chronicle/config";

export type CssVariables = Record<`--${string}`, string>;

export const COLOR_TOKENS = [
  "canvas",
  "card",
  "cardBorder",
  "cardGlow",
  "inputSurface",
  "audioPillBg",
  "overlayVignette",
  "hairline",
  "hairlineStrong",
  "raised",
  "raisedHover",
  "sunken",
  "scrim",
  "textPrimary",
  "textSecondary",
  "textMuted",
  "textAccent",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "accent",
  "accentForeground",
  "success",
  "warning",
  "danger",
  "shadowColor",
] as const satisfies readonly (keyof ThemeTokens)[];

export type ThemeColorKey = (typeof COLOR_TOKENS)[number];

function kebab(value: string): string {
  return value.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);
}

export function toCssVariables(tokens: ThemeTokens): CssVariables {
  const variables: CssVariables = {};
  for (const key of COLOR_TOKENS) {
    variables[`--color-${kebab(key)}`] = String(tokens[key]);
  }
  variables["--radius-card"] = `${tokens.radius}px`;
  variables["--radius-control"] = `${Math.round(tokens.radius * 0.6)}px`;
  variables["--border-width-card"] = `${tokens.borderWidth}px`;
  variables["--blur-card"] = `${tokens.blurIntensity}px`;
  variables["--glass-opacity"] = String(tokens.glassOpacity);
  variables["--glass-opacity-overlay"] = String(Math.max(tokens.glassOpacity, 0.5));
  const offset = tokens.shadowOffset;
  variables["--shadow-offset"] = `${offset}px`;
  variables["--shadow-hard"] =
    offset === 0 ? "none" : `${offset}px ${offset}px 0 0 ${tokens.shadowColor}`;
  variables["--shadow-overlay"] =
    offset === 0
      ? "0 24px 60px -20px rgb(0 0 0 / 0.75)"
      : `${offset}px ${offset}px 0 0 ${tokens.shadowColor}`;
  variables["--hover-lift"] = offset === 0 ? "-2px" : "0px";
  variables["--press-scale"] = offset === 0 ? "0.97" : "0.98";
  variables["--font-scale"] = String(tokens.fontScale);
  variables["--font-narrative"] = tokens.fontNarrative;
  variables["--font-ui"] = tokens.fontUI;
  variables["--font-mono"] = tokens.fontMono;
  variables["--leading-narrative"] = String(tokens.lineHeightMultiplier);
  variables["--tracking-narrative"] = `${tokens.letterSpacing}px`;
  return variables;
}

export function scaledFontSize(tokens: ThemeTokens, base: number): number {
  return Math.round(base * tokens.fontScale);
}
