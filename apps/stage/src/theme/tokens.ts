import type { ThemeTokens } from "@chronicle/shared";

export type CssVariables = Record<`--${string}`, string>;

const COLOR_TOKENS = [
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
] as const satisfies readonly (keyof ThemeTokens)[];

function kebab(value: string): string {
  return value.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);
}

export function toCssVariables(tokens: ThemeTokens): CssVariables {
  const variables: CssVariables = {};
  for (const key of COLOR_TOKENS) {
    variables[`--color-${kebab(key)}`] = String(tokens[key]);
  }
  variables["--radius-card"] = `${tokens.radius}px`;
  variables["--radius-control"] = `${Math.max(6, Math.round(tokens.radius * 0.6))}px`;
  variables["--border-width-card"] = `${tokens.borderWidth}px`;
  variables["--blur-card"] = `${tokens.blurIntensity}px`;
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
