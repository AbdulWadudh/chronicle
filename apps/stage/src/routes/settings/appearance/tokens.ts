import type { SettingBound, ThemeTokens } from "@chronicle/shared";

export type ColorTokenKey = Extract<
  keyof ThemeTokens,
  | "canvas"
  | "card"
  | "cardBorder"
  | "cardGlow"
  | "inputSurface"
  | "audioPillBg"
  | "hairline"
  | "hairlineStrong"
  | "raised"
  | "raisedHover"
  | "sunken"
  | "scrim"
  | "overlayVignette"
  | "textPrimary"
  | "textSecondary"
  | "textMuted"
  | "textAccent"
  | "primary"
  | "primaryForeground"
  | "secondary"
  | "secondaryForeground"
  | "accent"
  | "accentForeground"
  | "success"
  | "warning"
  | "danger"
>;

export interface ColorSection {
  title: string;
  hint: string;
  keys: readonly ColorTokenKey[];
}

export const COLOR_SECTIONS: readonly ColorSection[] = [
  {
    title: "Surfaces",
    hint: "The page, the cards sitting on it, and the hairlines between them.",
    keys: ["canvas", "card", "cardBorder", "inputSurface", "audioPillBg", "cardGlow"],
  },
  {
    title: "Elevation",
    hint: "Translucent layers used for rows, hovers, tracks and the modal scrim.",
    keys: ["hairline", "hairlineStrong", "raised", "raisedHover", "sunken", "scrim"],
  },
  {
    title: "Text",
    hint: "Reading hierarchy, from headings down to hints.",
    keys: ["textPrimary", "textSecondary", "textMuted", "textAccent"],
  },
  {
    title: "Brand",
    hint: "The accent that carries actions and selection.",
    keys: [
      "primary",
      "primaryForeground",
      "secondary",
      "secondaryForeground",
      "accent",
      "accentForeground",
    ],
  },
  {
    title: "Status",
    hint: "Reserved meanings. Keep these distinguishable from the brand colour.",
    keys: ["success", "warning", "danger", "overlayVignette"],
  },
];

export const COLOR_LABELS: Record<ColorTokenKey, string> = {
  canvas: "Canvas",
  card: "Card",
  cardBorder: "Card border",
  cardGlow: "Card glow",
  inputSurface: "Input surface",
  audioPillBg: "Audio pill",
  hairline: "Hairline",
  hairlineStrong: "Hairline strong",
  raised: "Raised",
  raisedHover: "Raised hover",
  sunken: "Sunken",
  scrim: "Scrim",
  overlayVignette: "Vignette",
  textPrimary: "Primary text",
  textSecondary: "Secondary text",
  textMuted: "Muted text",
  textAccent: "Accent text",
  primary: "Primary",
  primaryForeground: "On primary",
  secondary: "Secondary",
  secondaryForeground: "On secondary",
  accent: "Accent",
  accentForeground: "On accent",
  success: "Success",
  warning: "Warning",
  danger: "Danger",
};

export type NumericTokenKey = Extract<
  keyof ThemeTokens,
  | "radius"
  | "borderWidth"
  | "glassOpacity"
  | "blurIntensity"
  | "fontScale"
  | "lineHeightMultiplier"
  | "letterSpacing"
>;

export interface NumericTokenMeta {
  label: string;
  hint: string;
  unit?: string;
  bound: SettingBound;
}

export const NUMERIC_TOKENS: Record<NumericTokenKey, NumericTokenMeta> = {
  radius: {
    label: "Corner radius",
    unit: "px",
    hint: "How round cards and controls are. Controls use a smaller radius derived from this.",
    bound: { min: 0, max: 32, step: 1 },
  },
  borderWidth: {
    label: "Border width",
    unit: "px",
    hint: "Thickness of card outlines, and of node strokes on the story map.",
    bound: { min: 0, max: 3, step: 0.5 },
  },
  fontScale: {
    label: "Text size",
    unit: "x",
    hint: "Scales every size in the app at once. 1 is the designed size.",
    bound: { min: 0.8, max: 1.4, step: 0.05 },
  },
  lineHeightMultiplier: {
    label: "Line height",
    hint: "Leading for narrative prose. Higher is airier and easier on long passages.",
    bound: { min: 1.2, max: 2.2, step: 0.05 },
  },
  letterSpacing: {
    label: "Letter spacing",
    unit: "px",
    hint: "Tracking across body text. Small changes go a long way.",
    bound: { min: -1, max: 2, step: 0.1 },
  },
  blurIntensity: {
    label: "Blur",
    unit: "px",
    hint: "Backdrop blur behind modals and glass surfaces.",
    bound: { min: 0, max: 60, step: 2 },
  },
  glassOpacity: {
    label: "Glass opacity",
    hint: "How solid those blurred surfaces sit over what is behind them.",
    bound: { min: 0, max: 1, step: 0.05 },
  },
};

export const NUMERIC_ORDER: readonly NumericTokenKey[] = [
  "radius",
  "borderWidth",
  "fontScale",
  "lineHeightMultiplier",
  "letterSpacing",
  "blurIntensity",
  "glassOpacity",
];

export type FontTokenKey = Extract<keyof ThemeTokens, "fontUI" | "fontNarrative" | "fontMono">;

export interface FontTokenMeta {
  label: string;
  hint: string;
}

export const FONT_TOKENS: Record<FontTokenKey, FontTokenMeta> = {
  fontUI: {
    label: "Interface font",
    hint: "Labels, buttons and everything that is not story prose.",
  },
  fontNarrative: {
    label: "Narrative font",
    hint: "The story itself. A serif often reads more comfortably over long passages.",
  },
  fontMono: {
    label: "Monospace font",
    hint: "Checkpoint names, sampler ids and other literal values.",
  },
};

export const FONT_ORDER: readonly FontTokenKey[] = ["fontUI", "fontNarrative", "fontMono"];
