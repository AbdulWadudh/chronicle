import type { PaletteDocument, ThemeScheme, ThemeTokens } from "@chronicle/config";
import { PALETTE_DOCUMENTS } from "@chronicle/config";

export type PaletteOverrides = Record<ThemeScheme, Partial<ThemeTokens>>;

export interface ThemePalette {
  id: string;
  name: string;
  blurb: string;
  overrides: PaletteOverrides;
}

function expand(
  shape: Record<string, string | number>,
  scheme: Record<string, string> & { primary: string },
): Partial<ThemeTokens> {
  return {
    cardGlow: scheme.primary,
    textAccent: scheme.primary,
    shadowColor: scheme.textPrimary,
    ...shape,
    ...scheme,
  } as Partial<ThemeTokens>;
}

function toPalette(document: PaletteDocument): ThemePalette {
  return {
    id: document.id,
    name: document.name,
    blurb: document.blurb,
    overrides: {
      dark: expand(document.shape, document.dark),
      light: expand(document.shape, document.light),
    },
  };
}

export const THEME_PALETTES: readonly ThemePalette[] = PALETTE_DOCUMENTS.map(toPalette);

export function findPalette(id: string): ThemePalette | undefined {
  return THEME_PALETTES.find((palette) => palette.id === id);
}
