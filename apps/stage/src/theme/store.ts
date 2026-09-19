import {
  DEFAULT_LIGHT_THEME_TOKENS,
  DEFAULT_THEME_TOKENS,
  mergeThemeTokens,
  type ThemeTokens,
} from "@chronicle/shared";
import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const THEME_STORAGE_KEY = "@chronicle_theme_v3";

export type ThemePreference = "system" | "dark" | "light";

export type ThemeScheme = "dark" | "light";

export type SchemeOverrides = Record<ThemeScheme, Partial<ThemeTokens>>;

const EMPTY_OVERRIDES: SchemeOverrides = { dark: {}, light: {} };

interface ThemeState {
  preference: ThemePreference;
  systemIsDark: boolean;
  globalOverrides: SchemeOverrides;
  storyOverrides: Record<string, Partial<ThemeTokens>>;
  activeStoryId: string | null;
  cinemaMode: boolean;
  setPreference: (preference: ThemePreference) => void;
  setSystemIsDark: (isDark: boolean) => void;
  setGlobalOverride: (patch: Partial<ThemeTokens>) => void;
  clearGlobalOverride: (key: keyof ThemeTokens) => void;
  setStoryOverride: (storyId: string, patch: Partial<ThemeTokens>) => void;
  clearStoryOverride: (storyId: string) => void;
  setActiveStory: (storyId: string | null) => void;
  toggleCinemaMode: () => void;
  resetTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      systemIsDark: true,
      globalOverrides: { dark: {}, light: {} },
      storyOverrides: {},
      activeStoryId: null,
      cinemaMode: true,
      setPreference: (preference) => set({ preference }),
      setSystemIsDark: (systemIsDark) => set({ systemIsDark }),
      setGlobalOverride: (patch) =>
        set((state) => {
          const scheme = activeScheme(state.preference, state.systemIsDark);
          return {
            globalOverrides: {
              ...state.globalOverrides,
              [scheme]: { ...state.globalOverrides[scheme], ...patch },
            },
          };
        }),
      clearGlobalOverride: (key) =>
        set((state) => {
          const scheme = activeScheme(state.preference, state.systemIsDark);
          const next = { ...state.globalOverrides[scheme] };
          delete next[key];
          return { globalOverrides: { ...state.globalOverrides, [scheme]: next } };
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
      resetTheme: () => set({ globalOverrides: { dark: {}, light: {} }, storyOverrides: {} }),
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({
        preference: state.preference,
        globalOverrides: state.globalOverrides,
        storyOverrides: state.storyOverrides,
        cinemaMode: state.cinemaMode,
      }),
    },
  ),
);

function activeScheme(preference: ThemePreference, systemIsDark: boolean): ThemeScheme {
  if (preference === "system") return systemIsDark ? "dark" : "light";
  return preference;
}

export function useScheme(): ThemeScheme {
  const preference = useThemeStore((state) => state.preference);
  const systemIsDark = useThemeStore((state) => state.systemIsDark);
  return activeScheme(preference, systemIsDark);
}

export function useSchemeOverrides(): Partial<ThemeTokens> {
  const scheme = useScheme();
  const overrides = useThemeStore((state) => state.globalOverrides);
  return overrides[scheme] ?? {};
}

export function useIsDark(): boolean {
  const preference = useThemeStore((state) => state.preference);
  const systemIsDark = useThemeStore((state) => state.systemIsDark);
  return preference === "system" ? systemIsDark : preference === "dark";
}

export function useResolvedTheme(): ThemeTokens {
  const preference = useThemeStore((state) => state.preference);
  const systemIsDark = useThemeStore((state) => state.systemIsDark);
  const globalOverrides = useThemeStore((state) => state.globalOverrides);
  const storyOverrides = useThemeStore((state) => state.storyOverrides);
  const activeStoryId = useThemeStore((state) => state.activeStoryId);

  return useMemo(() => {
    const scheme = activeScheme(preference, systemIsDark);
    const base = scheme === "dark" ? DEFAULT_THEME_TOKENS : DEFAULT_LIGHT_THEME_TOKENS;
    const global = globalOverrides[scheme] ?? EMPTY_OVERRIDES[scheme];
    const story = activeStoryId === null ? {} : (storyOverrides[activeStoryId] ?? {});
    return mergeThemeTokens(mergeThemeTokens(base, global), story);
  }, [preference, systemIsDark, globalOverrides, storyOverrides, activeStoryId]);
}
