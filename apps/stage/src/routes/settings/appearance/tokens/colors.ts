import type { ThemeTokens } from "@chronicle/config";

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
  | "shadowColor"
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
    hint: "Page, cards and inputs.",
    keys: ["canvas", "card", "cardBorder", "inputSurface", "audioPillBg", "cardGlow"],
  },
  {
    title: "Elevation",
    hint: "Rows, hovers, tracks and the scrim.",
    keys: ["hairline", "hairlineStrong", "raised", "raisedHover", "sunken", "scrim", "shadowColor"],
  },
  {
    title: "Text",
    hint: "Reading hierarchy.",
    keys: ["textPrimary", "textSecondary", "textMuted", "textAccent"],
  },
  {
    title: "Brand",
    hint: "Actions and selection.",
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
    hint: "Reserved meanings.",
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
  shadowColor: "Hard shadow",
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
