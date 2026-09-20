import {
  DEFAULT_LIGHT_THEME_TOKENS,
  DEFAULT_THEME_TOKENS,
  type ThemeScheme,
  type ThemeTokens,
} from "@chronicle/config";
import { mergeThemeTokens, THEME_PALETTES, type ThemePalette } from "@chronicle/utils";
import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const THEME_STORAGE_KEY = "@chronicle_theme_v4";

export type ThemePreference = "system" | "dark" | "light";

export type MotionLevel = "off" | "subtle" | "full";

export type ScrollbarStyle = "full" | "thin" | "hidden";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type SchemeOverrides = Record<ThemeScheme, Partial<ThemeTokens>>;

const EMPTY: Partial<ThemeTokens> = {};

interface ThemeState {
  preference: ThemePreference;
  systemIsDark: boolean;
  paletteId: string | null;
  palettes: readonly ThemePalette[];
  customOverrides: SchemeOverrides;
  storyOverrides: Record<string, Partial<ThemeTokens>>;
  activeStoryId: string | null;
  cinemaMode: boolean;
  toastPosition: ToastPosition;
  motionLevel: MotionLevel;
  scrollbar: ScrollbarStyle;
  setPreference: (preference: ThemePreference) => void;
  setSystemIsDark: (isDark: boolean) => void;
  setPalettes: (palettes: readonly ThemePalette[]) => void;
  applyPalette: (paletteId: string | null) => void;
  mergePalette: (paletteId: string, keys: readonly (keyof ThemeTokens)[]) => void;
  setGlobalOverride: (patch: Partial<ThemeTokens>) => void;
  clearGlobalOverride: (key: keyof ThemeTokens) => void;
  clearSchemeOverride: (scheme: ThemeScheme, key: keyof ThemeTokens) => void;
  setStoryOverride: (storyId: string, patch: Partial<ThemeTokens>) => void;
  clearStoryOverride: (storyId: string) => void;
  setActiveStory: (storyId: string | null) => void;
  toggleCinemaMode: () => void;
  setToastPosition: (position: ToastPosition) => void;
  setMotionLevel: (level: MotionLevel) => void;
  setScrollbar: (style: ScrollbarStyle) => void;
  resetTheme: () => void;
}

function activeScheme(preference: ThemePreference, systemIsDark: boolean): ThemeScheme {
  if (preference === "system") return systemIsDark ? "dark" : "light";
  return preference;
}

function pick(
  tokens: Partial<ThemeTokens>,
  keys: readonly (keyof ThemeTokens)[],
): Partial<ThemeTokens> {
  const picked: Partial<ThemeTokens> = {};
  for (const key of keys) {
    const value = tokens[key];
    if (value !== undefined) Object.assign(picked, { [key]: value });
  }
  return picked;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      systemIsDark: true,
      paletteId: null,
      palettes: THEME_PALETTES,
      customOverrides: { dark: {}, light: {} },
      storyOverrides: {},
      activeStoryId: null,
      cinemaMode: true,
      toastPosition: "bottom-right",
      motionLevel: "full",
      scrollbar: "thin",
      setPreference: (preference) => set({ preference }),
      setSystemIsDark: (systemIsDark) => set({ systemIsDark }),
      setPalettes: (palettes) => set({ palettes }),
      applyPalette: (paletteId) => set({ paletteId, customOverrides: { dark: {}, light: {} } }),
      mergePalette: (paletteId, keys) =>
        set((state) => {
          const source = state.palettes.find((one) => one.id === paletteId);
          if (source === undefined) return {};
          return {
            customOverrides: {
              dark: { ...state.customOverrides.dark, ...pick(source.overrides.dark, keys) },
              light: { ...state.customOverrides.light, ...pick(source.overrides.light, keys) },
            },
          };
        }),
      setGlobalOverride: (patch) =>
        set((state) => {
          const scheme = activeScheme(state.preference, state.systemIsDark);
          const palette = state.palettes.find((one) => one.id === state.paletteId);
          const baseline = mergeThemeTokens(
            baseTokens(scheme),
            palette?.overrides[scheme] ?? EMPTY,
          );
          const next = { ...state.customOverrides[scheme] };

          for (const [key, value] of Object.entries(patch)) {
            const token = key as keyof ThemeTokens;
            if (value === baseline[token]) delete next[token];
            else Object.assign(next, { [token]: value });
          }

          return { customOverrides: { ...state.customOverrides, [scheme]: next } };
        }),
      clearGlobalOverride: (key) =>
        set((state) => {
          const scheme = activeScheme(state.preference, state.systemIsDark);
          const next = { ...state.customOverrides[scheme] };
          delete next[key];
          return { customOverrides: { ...state.customOverrides, [scheme]: next } };
        }),
      clearSchemeOverride: (scheme, key) =>
        set((state) => {
          const next = { ...state.customOverrides[scheme] };
          delete next[key];
          return { customOverrides: { ...state.customOverrides, [scheme]: next } };
        }),
      setStoryOverride: (storyId, patch) =>
        set((state) => ({
          storyOverrides: {
            ...state.storyOverrides,
            [storyId]: { ...state.storyOverrides[storyId], ...patch },
          },
        })),
      clearStoryOverride: (storyId) =>
        set((state) => {
          const next = { ...state.storyOverrides };
          delete next[storyId];
          return { storyOverrides: next };
        }),
      setActiveStory: (activeStoryId) => set({ activeStoryId }),
      toggleCinemaMode: () => set((state) => ({ cinemaMode: !state.cinemaMode })),
      setToastPosition: (toastPosition) => set({ toastPosition }),
      setMotionLevel: (motionLevel) => set({ motionLevel }),
      setScrollbar: (scrollbar) => set({ scrollbar }),
      resetTheme: () =>
        set({ paletteId: null, customOverrides: { dark: {}, light: {} }, storyOverrides: {} }),
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({
        preference: state.preference,
        paletteId: state.paletteId,
        palettes: state.palettes,
        customOverrides: state.customOverrides,
        storyOverrides: state.storyOverrides,
        cinemaMode: state.cinemaMode,
        toastPosition: state.toastPosition,
        motionLevel: state.motionLevel,
        scrollbar: state.scrollbar,
      }),
    },
  ),
);

export function useScheme(): ThemeScheme {
  const preference = useThemeStore((state) => state.preference);
  const systemIsDark = useThemeStore((state) => state.systemIsDark);
  return activeScheme(preference, systemIsDark);
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
  const scheme = useScheme();
  const palette = useActivePalette();
  return palette === null ? EMPTY : palette.overrides[scheme];
}

export function useCustomOverrides(): Partial<ThemeTokens> {
  const scheme = useScheme();
  const overrides = useThemeStore((state) => state.customOverrides);
  return overrides[scheme] ?? EMPTY;
}

export function baseTokens(scheme: ThemeScheme): ThemeTokens {
  return scheme === "dark" ? DEFAULT_THEME_TOKENS : DEFAULT_LIGHT_THEME_TOKENS;
}

export function useResolvedTheme(): ThemeTokens {
  const scheme = useScheme();
  const palette = usePaletteTokens();
  const custom = useCustomOverrides();
  const storyOverrides = useThemeStore((state) => state.storyOverrides);
  const activeStoryId = useThemeStore((state) => state.activeStoryId);

  return useMemo(() => {
    const story = activeStoryId === null ? EMPTY : (storyOverrides[activeStoryId] ?? EMPTY);
    return mergeThemeTokens(
      mergeThemeTokens(mergeThemeTokens(baseTokens(scheme), palette), custom),
      story,
    );
  }, [scheme, palette, custom, storyOverrides, activeStoryId]);
}

export function useDefaultTokens(): ThemeTokens {
  const scheme = useScheme();
  const palette = usePaletteTokens();
  return useMemo(() => mergeThemeTokens(baseTokens(scheme), palette), [scheme, palette]);
}
