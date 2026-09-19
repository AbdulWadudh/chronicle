export interface ThemeTokens {
  mode: "dark" | "light";
  canvas: string;
  card: string;
  cardBorder: string;
  cardGlow: string;
  inputSurface: string;
  audioPillBg: string;
  overlayVignette: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  success: string;
  warning: string;
  danger: string;
  radius: number;
  borderWidth: number;
  glassOpacity: number;
  blurIntensity: number;
  fontNarrative: string;
  fontUI: string;
  fontMono: string;
  fontScale: number;
  lineHeightMultiplier: number;
  letterSpacing: number;
}

export type ThemeTokenKey = keyof ThemeTokens;

const SHARED_TYPOGRAPHY = {
  fontNarrative: "Literata",
  fontUI: "Inter",
  fontMono: "JetBrainsMono",
  fontScale: 1,
  lineHeightMultiplier: 1.6,
  letterSpacing: 0,
} as const;

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  mode: "dark",
  canvas: "#07070B",
  card: "#111117",
  cardBorder: "#23232E",
  cardGlow: "#7C5CFF",
  inputSurface: "#16161D",
  audioPillBg: "#1C1C26",
  overlayVignette: "#00000099",
  textPrimary: "#F4F4F7",
  textSecondary: "#B7B7C4",
  textMuted: "#72727F",
  textAccent: "#A78BFA",
  primary: "#7C5CFF",
  primaryForeground: "#0B0B10",
  secondary: "#1F1F2A",
  secondaryForeground: "#E6E6EE",
  accent: "#22D3EE",
  accentForeground: "#04141A",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#DC2626",
  radius: 16,
  borderWidth: 1,
  glassOpacity: 0.72,
  blurIntensity: 28,
  ...SHARED_TYPOGRAPHY,
};

export const DEFAULT_LIGHT_THEME_TOKENS: ThemeTokens = {
  mode: "light",
  canvas: "#F7F7FA",
  card: "#FFFFFF",
  cardBorder: "#E3E3EA",
  cardGlow: "#6D4DF2",
  inputSurface: "#F1F1F6",
  audioPillBg: "#ECECF3",
  overlayVignette: "#0000001A",
  textPrimary: "#14141A",
  textSecondary: "#4A4A58",
  textMuted: "#8A8A99",
  textAccent: "#6D4DF2",
  primary: "#6D4DF2",
  primaryForeground: "#FFFFFF",
  secondary: "#E9E9F1",
  secondaryForeground: "#1B1B24",
  accent: "#0891B2",
  accentForeground: "#FFFFFF",
  success: "#059669",
  warning: "#D97706",
  danger: "#B91C1C",
  radius: 16,
  borderWidth: 1,
  glassOpacity: 0.86,
  blurIntensity: 18,
  ...SHARED_TYPOGRAPHY,
};

export const THEME_PRESETS: Record<ThemeTokens["mode"], ThemeTokens> = {
  dark: DEFAULT_THEME_TOKENS,
  light: DEFAULT_LIGHT_THEME_TOKENS,
};

export function mergeThemeTokens(base: ThemeTokens, overrides: Partial<ThemeTokens>): ThemeTokens {
  return { ...base, ...overrides };
}
