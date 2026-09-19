import {
  DEFAULT_LIGHT_THEME_TOKENS,
  DEFAULT_THEME_TOKENS,
  mergeThemeTokens,
  type ThemeTokens,
} from "@chronicle/shared";
import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const THEME_STORAGE_KEY = "@chronicle_theme_v2";

export type ThemePreference = "system" | "dark" | "light";

interface ThemeState {
  preference: ThemePreference;
  systemIsDark: boolean;
  globalOverrides: Partial<ThemeTokens>;
  storyOverrides: Record<string, Partial<ThemeTokens>>;
  activeStoryId: string | null;
  cinemaMode: boolean;
  setPreference: (preference: ThemePreference) => void;
  setSystemIsDark: (isDark: boolean) => void;
  setGlobalOverride: (patch: Partial<ThemeTokens>) => void;
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
      globalOverrides: {},
      storyOverrides: {},
      activeStoryId: null,
      cinemaMode: true,
      setPreference: (preference) => set({ preference }),
      setSystemIsDark: (systemIsDark) => set({ systemIsDark }),
      setGlobalOverride: (patch) =>
        set((state) => ({ globalOverrides: { ...state.globalOverrides, ...patch } })),
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
      resetTheme: () => set({ globalOverrides: {}, storyOverrides: {} }),
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
    const isDark = preference === "system" ? systemIsDark : preference === "dark";
    const base = isDark ? DEFAULT_THEME_TOKENS : DEFAULT_LIGHT_THEME_TOKENS;
    const story = activeStoryId === null ? {} : (storyOverrides[activeStoryId] ?? {});
    return mergeThemeTokens(mergeThemeTokens(base, globalOverrides), story);
  }, [preference, systemIsDark, globalOverrides, storyOverrides, activeStoryId]);
}
