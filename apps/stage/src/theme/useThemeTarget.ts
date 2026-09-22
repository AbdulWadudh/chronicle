import type { ThemeTokens } from "@chronicle/config";
import { mergeThemeTokens, type PaletteOverrides } from "@chronicle/utils";
import { useCallback, useMemo } from "react";
import {
  baseTokens,
  useCustomOverrides,
  useEffectiveScheme,
  usePaletteTokens,
  useThemeStore,
} from "~/theme/store";

export type ThemeScope = "world" | "mine";

const EMPTY: Partial<ThemeTokens> = {};

export interface ThemeTarget {
  tokens: ThemeTokens;
  overrides: Partial<ThemeTokens>;
  setToken: (patch: Partial<ThemeTokens>) => void;
  clearToken: (key: keyof ThemeTokens) => void;
  clearAll: () => void;
}

export function useThemeTarget(
  scope: ThemeScope,
  worldId: string | null,
  worldTheme: PaletteOverrides | null,
  onWorldThemeChange: (next: PaletteOverrides) => void,
): ThemeTarget {
  const scheme = useEffectiveScheme();
  const palette = usePaletteTokens();
  const custom = useCustomOverrides();
  const worldOverrides = useThemeStore((state) => state.worldOverrides);
  const setWorldOverride = useThemeStore((state) => state.setWorldOverride);
  const clearWorldOverrideKey = useThemeStore((state) => state.clearWorldOverrideKey);
  const clearWorldOverride = useThemeStore((state) => state.clearWorldOverride);

  const authored = worldTheme?.[scheme] ?? EMPTY;
  const world = worldId === null ? undefined : worldOverrides[worldId];
  const scoped = world?.[scheme] ?? EMPTY;
  const shared = world?.shared ?? EMPTY;
  const mine = useMemo(() => ({ ...scoped, ...shared }), [scoped, shared]);
  const overrides = scope === "world" ? authored : mine;

  const tokens = useMemo(() => {
    const global = mergeThemeTokens(mergeThemeTokens(baseTokens(scheme), palette), custom);
    return mergeThemeTokens(mergeThemeTokens(global, authored), mine);
  }, [scheme, palette, custom, authored, mine]);

  const setToken = useCallback(
    (patch: Partial<ThemeTokens>) => {
      if (scope === "mine") {
        if (worldId !== null) setWorldOverride(worldId, scheme, patch);
        return;
      }
      const base: PaletteOverrides = worldTheme ?? { dark: {}, light: {} };
      onWorldThemeChange({ ...base, [scheme]: { ...base[scheme], ...patch } });
    },
    [scope, worldId, scheme, worldTheme, onWorldThemeChange, setWorldOverride],
  );

  const clearToken = useCallback(
    (key: keyof ThemeTokens) => {
      if (scope === "mine") {
        if (worldId !== null) clearWorldOverrideKey(worldId, scheme, key);
        return;
      }
      const base: PaletteOverrides = worldTheme ?? { dark: {}, light: {} };
      const next = { ...base[scheme] };
      delete next[key];
      onWorldThemeChange({ ...base, [scheme]: next });
    },
    [scope, worldId, scheme, worldTheme, onWorldThemeChange, clearWorldOverrideKey],
  );

  const clearAll = useCallback(() => {
    if (scope === "mine") {
      if (worldId !== null) clearWorldOverride(worldId);
      return;
    }
    onWorldThemeChange({ dark: {}, light: {} });
  }, [scope, worldId, onWorldThemeChange, clearWorldOverride]);

  return { tokens, overrides, setToken, clearToken, clearAll };
}
