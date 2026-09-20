import type { ThemeScheme, ThemeTokens } from "@chronicle/config";
import { mergeThemeTokens } from "@chronicle/utils";
import { baseTokens, useThemeStore } from "~/theme/store";

export interface ThemeEdit {
  scheme: ThemeScheme;
  key: keyof ThemeTokens;
  before: string;
  after: string;
}

const SCHEMES: readonly ThemeScheme[] = ["dark", "light"];

export function usePendingEdits(): ThemeEdit[] {
  const palettes = useThemeStore((state) => state.palettes);
  const paletteId = useThemeStore((state) => state.paletteId);
  const customOverrides = useThemeStore((state) => state.customOverrides);

  const active = palettes.find((one) => one.id === paletteId);

  return SCHEMES.flatMap((scheme) => {
    const baseline = mergeThemeTokens(baseTokens(scheme), active?.overrides[scheme] ?? {});
    return Object.entries(customOverrides[scheme])
      .map((entry) => ({
        scheme,
        key: entry[0] as keyof ThemeTokens,
        before: String(baseline[entry[0] as keyof ThemeTokens]),
        after: String(entry[1]),
      }))
      .filter((edit) => edit.before !== edit.after);
  });
}
