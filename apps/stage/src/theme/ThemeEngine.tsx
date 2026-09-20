import { API, type ThemeTokens } from "@chronicle/config";
import type { ThemePalette } from "@chronicle/utils";
import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";
import { get } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import { familyFromStack, loadFontFamily } from "~/lib/googleFonts";
import { useIsDark, useResolvedTheme, useThemeStore } from "./store";
import { toCssVariables } from "./tokens";

const ThemeTokenContext = createContext<ThemeTokens | null>(null);

export function useThemeTokens(): ThemeTokens {
  const tokens = useContext(ThemeTokenContext);
  if (tokens === null) throw new Error("useThemeTokens must be used inside ThemeEngine");
  return tokens;
}

export function ThemeEngine({ children }: { children: ReactNode }) {
  const setSystemIsDark = useThemeStore((state) => state.setSystemIsDark);
  const setPalettes = useThemeStore((state) => state.setPalettes);
  const { user } = useAuth();
  const tokens = useResolvedTheme();
  const isDark = useIsDark();
  const motionLevel = useThemeStore((state) => state.motionLevel);
  const scrollbar = useThemeStore((state) => state.scrollbar);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (): void => setSystemIsDark(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [setSystemIsDark]);

  useEffect(() => {
    if (user === null) return;
    let abandoned = false;
    get<{ palettes: ThemePalette[] }>(API.themes)
      .then((body) => {
        if (!abandoned && body.palettes.length > 0) setPalettes(body.palettes);
      })
      .catch(() => undefined);
    return () => {
      abandoned = true;
    };
  }, [user, setPalettes]);

  const variables = useMemo(() => toCssVariables(tokens), [tokens]);

  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(variables)) root.style.setProperty(name, value);
  }, [variables]);

  useEffect(() => {
    document.documentElement.dataset.motion = motionLevel;
  }, [motionLevel]);

  useEffect(() => {
    document.documentElement.dataset.scrollbar = scrollbar;
  }, [scrollbar]);

  useEffect(() => {
    for (const stack of [tokens.fontUI, tokens.fontNarrative, tokens.fontMono]) {
      const family = familyFromStack(stack);
      if (family !== null) loadFontFamily(family);
    }
  }, [tokens.fontUI, tokens.fontNarrative, tokens.fontMono]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.colorScheme = isDark ? "dark" : "light";
    root.classList.toggle("dark", isDark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tokens.canvas);
  }, [isDark, tokens.canvas]);

  return <ThemeTokenContext.Provider value={tokens}>{children}</ThemeTokenContext.Provider>;
}
