import type { ThemeTokens } from "@chronicle/config";

export type FontTokenKey = Extract<keyof ThemeTokens, "fontUI" | "fontNarrative" | "fontMono">;

export interface FontTokenMeta {
  label: string;
  hint: string;
}

export const FONT_TOKENS: Record<FontTokenKey, FontTokenMeta> = {
  fontUI: {
    label: "Interface font",
    hint: "Labels and buttons.",
  },
  fontNarrative: {
    label: "Narrative font",
    hint: "The story prose.",
  },
  fontMono: {
    label: "Monospace font",
    hint: "Literal values and ids.",
  },
};

export const FONT_ORDER: readonly FontTokenKey[] = ["fontUI", "fontNarrative", "fontMono"];
