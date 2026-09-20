import type { SettingBound, ThemeTokens } from "@chronicle/config";

export type NumericTokenKey = Extract<
  keyof ThemeTokens,
  | "radius"
  | "borderWidth"
  | "glassOpacity"
  | "blurIntensity"
  | "shadowOffset"
  | "fontScale"
  | "lineHeightMultiplier"
  | "letterSpacing"
>;

export interface NumericPreset {
  label: string;
  value: number;
}

export interface NumericTokenMeta {
  label: string;
  hint: string;
  unit?: string;
  bound: SettingBound;
  presets: readonly NumericPreset[];
}

export const NUMERIC_TOKENS: Record<NumericTokenKey, NumericTokenMeta> = {
  radius: {
    label: "Corner radius",
    unit: "px",
    hint: "Corner rounding. Controls use a tighter radius.",
    bound: { min: 0, max: 32, step: 1 },
    presets: [
      { label: "Square", value: 0 },
      { label: "Soft", value: 8 },
      { label: "Round", value: 16 },
      { label: "Pill", value: 28 },
    ],
  },
  borderWidth: {
    label: "Border width",
    unit: "px",
    hint: "Outline thickness.",
    bound: { min: 0, max: 3, step: 0.5 },
    presets: [
      { label: "None", value: 0 },
      { label: "Hairline", value: 1 },
      { label: "Bold", value: 2 },
      { label: "Heavy", value: 3 },
    ],
  },
  fontScale: {
    label: "Text size",
    unit: "x",
    hint: "Scales every size at once.",
    bound: { min: 0.8, max: 1.4, step: 0.05 },
    presets: [
      { label: "Small", value: 0.9 },
      { label: "Designed", value: 1 },
      { label: "Large", value: 1.15 },
      { label: "Huge", value: 1.3 },
    ],
  },
  lineHeightMultiplier: {
    label: "Line height",
    hint: "Leading for narrative prose.",
    bound: { min: 1.2, max: 2.2, step: 0.05 },
    presets: [
      { label: "Tight", value: 1.35 },
      { label: "Designed", value: 1.6 },
      { label: "Airy", value: 1.9 },
    ],
  },
  letterSpacing: {
    label: "Letter spacing",
    unit: "px",
    hint: "Tracking across body text.",
    bound: { min: -1, max: 2, step: 0.1 },
    presets: [
      { label: "Tight", value: -0.4 },
      { label: "Designed", value: 0 },
      { label: "Loose", value: 0.6 },
    ],
  },
  blurIntensity: {
    label: "Blur",
    unit: "px",
    hint: "Backdrop blur. Open the preview overlay to see it.",
    bound: { min: 0, max: 60, step: 2 },
    presets: [
      { label: "None", value: 0 },
      { label: "Light", value: 12 },
      { label: "Frosted", value: 32 },
      { label: "Heavy", value: 52 },
    ],
  },
  shadowOffset: {
    label: "Hard shadow",
    unit: "px",
    hint: "Above zero, pressing moves the control into its shadow.",
    bound: { min: 0, max: 10, step: 1 },
    presets: [
      { label: "None", value: 0 },
      { label: "Subtle", value: 2 },
      { label: "Hard", value: 5 },
      { label: "Brutal", value: 8 },
    ],
  },
  glassOpacity: {
    label: "Glass opacity",
    hint: "How solid overlays sit. Held at 0.5 or above.",
    bound: { min: 0, max: 1, step: 0.05 },
    presets: [
      { label: "Ghost", value: 0.5 },
      { label: "Clear", value: 0.65 },
      { label: "Hazy", value: 0.8 },
      { label: "Frosted", value: 0.9 },
      { label: "Solid", value: 1 },
    ],
  },
};

export const NUMERIC_ORDER: readonly NumericTokenKey[] = [
  "radius",
  "borderWidth",
  "fontScale",
  "lineHeightMultiplier",
  "letterSpacing",
  "shadowOffset",
  "blurIntensity",
  "glassOpacity",
];
