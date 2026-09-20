export interface ThemeTokens {
  mode: "dark" | "light";
  canvas: string;
  card: string;
  cardBorder: string;
  cardGlow: string;
  inputSurface: string;
  audioPillBg: string;
  overlayVignette: string;
  hairline: string;
  hairlineStrong: string;
  raised: string;
  raisedHover: string;
  sunken: string;
  scrim: string;
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
  shadowOffset: number;
  shadowColor: string;
  fontNarrative: string;
  fontUI: string;
  fontMono: string;
  fontScale: number;
  lineHeightMultiplier: number;
  letterSpacing: number;
}

export type ThemeTokenKey = keyof ThemeTokens;

export type ThemeScheme = ThemeTokens["mode"];

const SHARED_TYPOGRAPHY = {
  fontNarrative: '"Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif',
  fontUI: '"Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif',
  fontMono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontScale: 1,
  lineHeightMultiplier: 1.6,
  letterSpacing: 0,
} as const;

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  mode: "dark",
  canvas: "#050505",
  card: "#0C0C0E",
  cardBorder: "#1C1C20",
  cardGlow: "#D8A23A",
  inputSurface: "#121215",
  audioPillBg: "#17171B",
  overlayVignette: "#000000B8",
  hairline: "#FFFFFF0F",
  hairlineStrong: "#FFFFFF24",
  raised: "#FFFFFF05",
  raisedHover: "#FFFFFF0B",
  sunken: "#FFFFFF17",
  scrim: "#00000099",
  textPrimary: "#F5F3EE",
  textSecondary: "#A8A49C",
  textMuted: "#6B6862",
  textAccent: "#D8A23A",
  primary: "#D8A23A",
  primaryForeground: "#120D02",
  secondary: "#17171B",
  secondaryForeground: "#E8E5DE",
  accent: "#7C5CFF",
  accentForeground: "#0B0B10",
  success: "#4ADE80",
  warning: "#FBBF24",
  danger: "#F05252",
  radius: 20,
  borderWidth: 1,
  glassOpacity: 0.72,
  blurIntensity: 32,
  shadowOffset: 0,
  shadowColor: "#F5F3EE",
  ...SHARED_TYPOGRAPHY,
};

export const DEFAULT_LIGHT_THEME_TOKENS: ThemeTokens = {
  mode: "light",
  canvas: "#FAF8F4",
  card: "#FFFFFF",
  cardBorder: "#E6E1D8",
  cardGlow: "#B07C15",
  inputSurface: "#F2EFE9",
  audioPillBg: "#EDE9E1",
  overlayVignette: "#0000001A",
  hairline: "#16150F1A",
  hairlineStrong: "#16150F38",
  raised: "#16150F06",
  raisedHover: "#16150F0D",
  sunken: "#16150F1A",
  scrim: "#16150F73",
  textPrimary: "#16150F",
  textSecondary: "#57534A",
  textMuted: "#8A857B",
  textAccent: "#8A6410",
  primary: "#8A6410",
  primaryForeground: "#FFFFFF",
  secondary: "#EDE9E1",
  secondaryForeground: "#1E1C15",
  accent: "#5B3FD6",
  accentForeground: "#FFFFFF",
  success: "#15803D",
  warning: "#B45309",
  danger: "#B42318",
  radius: 20,
  borderWidth: 1,
  glassOpacity: 0.9,
  blurIntensity: 20,
  shadowOffset: 0,
  shadowColor: "#16150F",
  ...SHARED_TYPOGRAPHY,
};

export const THEME_PRESETS: Record<ThemeTokens["mode"], ThemeTokens> = {
  dark: DEFAULT_THEME_TOKENS,
  light: DEFAULT_LIGHT_THEME_TOKENS,
};
