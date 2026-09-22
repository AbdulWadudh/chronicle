import type { ThemeScheme, ThemeTokens } from "@chronicle/config";
import type { ThemePalette } from "@chronicle/utils";
import { mergeThemeTokens } from "@chronicle/utils";
import { useMemo } from "react";
import { activeScheme, baseTokens, EMPTY, useThemeStore } from "~/theme/store";

export function useScheme(): ThemeScheme {
  const preference = useThemeStore((state) => state.preference);
  const systemIsDark = useThemeStore((state) => state.systemIsDark);
  return activeScheme(preference, systemIsDark);
}

export function useEffectiveScheme(): ThemeScheme {
  const preference = useThemeStore((state) => state.preference);
  const systemIsDark = useThemeStore((state) => state.systemIsDark);
  const worldOverrides = useThemeStore((state) => state.worldOverrides);
  const activeWorldId = useThemeStore((state) => state.activeWorldId);
  const pinned = activeWorldId === null ? undefined : worldOverrides[activeWorldId]?.mode;
  return pinned ?? activeScheme(preference, systemIsDark);
}

export function useIsDark(): boolean {
  return useScheme() === "dark";
}

export function useActivePalette(): ThemePalette | null {
  const paletteId = useThemeStore((state) => state.paletteId);
  const palettes = useThemeStore((state) => state.palettes);
  return useMemo(
    () => (paletteId === null ? null : (palettes.find((one) => one.id === paletteId) ?? null)),
    [paletteId, palettes],
  );
}

export function usePaletteTokens(): Partial<ThemeTokens> {
  const scheme = useEffectiveScheme();
  const palette = useActivePalette();
  return palette === null ? EMPTY : palette.overrides[scheme];
}

export function useCustomOverrides(): Partial<ThemeTokens> {
  const scheme = useEffectiveScheme();
  const overrides = useThemeStore((state) => state.customOverrides);
  return overrides[scheme] ?? EMPTY;
}

export function useResolvedTheme(): ThemeTokens {
  const scheme = useEffectiveScheme();
  const palette = usePaletteTokens();
  const custom = useCustomOverrides();
  const worldTheme = useThemeStore((state) => state.worldTheme);
  const worldThemeEnabled = useThemeStore((state) => state.worldThemeEnabled);
  const worldOverrides = useThemeStore((state) => state.worldOverrides);
  const activeWorldId = useThemeStore((state) => state.activeWorldId);

  return useMemo(() => {
    const authored = worldThemeEnabled && worldTheme !== null ? worldTheme[scheme] : EMPTY;
    const world = activeWorldId === null ? undefined : worldOverrides[activeWorldId];
    const global = mergeThemeTokens(mergeThemeTokens(baseTokens(scheme), palette), custom);
    const withWorld = mergeThemeTokens(global, authored);
    const scoped = mergeThemeTokens(withWorld, world?.[scheme] ?? EMPTY);
    return mergeThemeTokens(scoped, world?.shared ?? EMPTY);
  }, [scheme, palette, custom, worldTheme, worldThemeEnabled, worldOverrides, activeWorldId]);
}

export function useDefaultTokens(): ThemeTokens {
  const scheme = useScheme();
  const palette = usePaletteTokens();
  return useMemo(() => mergeThemeTokens(baseTokens(scheme), palette), [scheme, palette]);
}
