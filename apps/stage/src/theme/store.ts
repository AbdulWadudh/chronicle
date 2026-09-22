import {
  DEFAULT_LIGHT_THEME_TOKENS,
  DEFAULT_THEME_TOKENS,
  type ThemeScheme,
  type ThemeTokens,
} from "@chronicle/config";
import {
  mergeThemeTokens,
  type PaletteOverrides,
  THEME_PALETTES,
  type ThemePalette,
} from "@chronicle/utils";
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

export const EMPTY: Partial<ThemeTokens> = {};

export const SHARED_TOKEN_KEYS: readonly (keyof ThemeTokens)[] = [
  "radius",
  "borderWidth",
  "fontScale",
  "lineHeightMultiplier",
  "letterSpacing",
  "shadowOffset",
  "blurIntensity",
  "glassOpacity",
  "fontUI",
  "fontNarrative",
  "fontMono",
];

export interface WorldTheme {
  mode?: ThemeScheme;
  dark: Partial<ThemeTokens>;
  light: Partial<ThemeTokens>;
  shared: Partial<ThemeTokens>;
}

export const EMPTY_WORLD_THEME: WorldTheme = { dark: {}, light: {}, shared: {} };

export function isSharedToken(key: keyof ThemeTokens): boolean {
  return SHARED_TOKEN_KEYS.includes(key);
}

export function baseTokens(scheme: ThemeScheme): ThemeTokens {
  return scheme === "dark" ? DEFAULT_THEME_TOKENS : DEFAULT_LIGHT_THEME_TOKENS;
}

interface ThemeState {
  preference: ThemePreference;
  systemIsDark: boolean;
  paletteId: string | null;
  palettes: readonly ThemePalette[];
  customOverrides: SchemeOverrides;
  storyOverrides: Record<string, Partial<ThemeTokens>>;
  activeStoryId: string | null;
  worldTheme: PaletteOverrides | null;
  worldThemeEnabled: boolean;
  worldOverrides: Record<string, WorldTheme>;
  activeWorldId: string | null;
  cinemaMode: boolean;
  immersive: boolean;
  historyActions: boolean;
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
  setWorldTheme: (worldId: string | null, theme: PaletteOverrides | null) => void;
  toggleWorldTheme: () => void;
  setWorldOverride: (worldId: string, scheme: ThemeScheme, patch: Partial<ThemeTokens>) => void;
  clearWorldOverride: (worldId: string) => void;
  setWorldMode: (worldId: string, scheme: ThemeScheme | null) => void;
  seedWorldOverride: (worldId: string, theme: WorldTheme) => void;
  clearWorldOverrideKey: (worldId: string, scheme: ThemeScheme, key: keyof ThemeTokens) => void;
  toggleCinemaMode: () => void;
  toggleImmersive: () => void;
  toggleHistoryActions: () => void;
  setToastPosition: (position: ToastPosition) => void;
  setMotionLevel: (level: MotionLevel) => void;
  setScrollbar: (style: ScrollbarStyle) => void;
  resetTheme: () => void;
}

export function activeScheme(preference: ThemePreference, systemIsDark: boolean): ThemeScheme {
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
      worldTheme: null,
      worldThemeEnabled: true,
      worldOverrides: {},
      activeWorldId: null,
      activeStoryId: null,
      cinemaMode: true,
      immersive: true,
      historyActions: false,
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
      setWorldTheme: (activeWorldId, worldTheme) => set({ activeWorldId, worldTheme }),
      toggleWorldTheme: () => set((state) => ({ worldThemeEnabled: !state.worldThemeEnabled })),
      setWorldOverride: (worldId, scheme, patch) =>
        set((state) => {
          const existing = state.worldOverrides[worldId] ?? EMPTY_WORLD_THEME;
          const shared = { ...existing.shared };
          const scoped = { ...existing[scheme] };
          for (const [key, value] of Object.entries(patch)) {
            const slot = isSharedToken(key as keyof ThemeTokens) ? shared : scoped;
            Object.assign(slot, { [key]: value });
          }
          return {
            worldOverrides: {
              ...state.worldOverrides,
              [worldId]: { ...existing, shared, [scheme]: scoped },
            },
          };
        }),
      seedWorldOverride: (worldId, theme) =>
        set((state) =>
          state.worldOverrides[worldId] === undefined
            ? { worldOverrides: { ...state.worldOverrides, [worldId]: theme } }
            : {},
        ),
      setWorldMode: (worldId, mode) =>
        set((state) => {
          const existing = state.worldOverrides[worldId] ?? EMPTY_WORLD_THEME;
          const next = { ...existing };
          if (mode === null) delete next.mode;
          else next.mode = mode;
          return { worldOverrides: { ...state.worldOverrides, [worldId]: next } };
        }),
      clearWorldOverrideKey: (worldId, scheme, key) =>
        set((state) => {
          const existing = state.worldOverrides[worldId];
          if (existing === undefined) return {};
          const shared = { ...existing.shared };
          const scoped = { ...existing[scheme] };
          delete shared[key];
          delete scoped[key];
          return {
            worldOverrides: {
              ...state.worldOverrides,
              [worldId]: { ...existing, shared, [scheme]: scoped },
            },
          };
        }),
      clearWorldOverride: (worldId) =>
        set((state) => {
          const next = { ...state.worldOverrides };
          delete next[worldId];
          return { worldOverrides: next };
        }),
      toggleCinemaMode: () => set((state) => ({ cinemaMode: !state.cinemaMode })),
      toggleImmersive: () => set((state) => ({ immersive: !state.immersive })),
      toggleHistoryActions: () => set((state) => ({ historyActions: !state.historyActions })),
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
        worldThemeEnabled: state.worldThemeEnabled,
        worldOverrides: state.worldOverrides,
        cinemaMode: state.cinemaMode,
        immersive: state.immersive,
        historyActions: state.historyActions,
        toastPosition: state.toastPosition,
        motionLevel: state.motionLevel,
        scrollbar: state.scrollbar,
      }),
    },
  ),
);

export * from "~/theme/selectors";
