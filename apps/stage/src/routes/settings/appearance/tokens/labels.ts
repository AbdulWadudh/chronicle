import type { ThemeTokens } from "@chronicle/config";
import { COLOR_LABELS } from "./colors";
import { FONT_TOKENS } from "./fonts";
import { NUMERIC_TOKENS } from "./measures";

export function isColorToken(key: keyof ThemeTokens): boolean {
  return key in COLOR_LABELS;
}

export function labelOf(key: keyof ThemeTokens): string {
  if (key in COLOR_LABELS) return COLOR_LABELS[key as keyof typeof COLOR_LABELS];
  if (key in NUMERIC_TOKENS) return NUMERIC_TOKENS[key as keyof typeof NUMERIC_TOKENS].label;
  if (key in FONT_TOKENS) return FONT_TOKENS[key as keyof typeof FONT_TOKENS].label;
  return key;
}
