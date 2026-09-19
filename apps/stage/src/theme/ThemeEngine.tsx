import type { ThemeTokens } from "@chronicle/shared";
import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";
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
  const tokens = useResolvedTheme();
  const isDark = useIsDark();

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (): void => setSystemIsDark(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [setSystemIsDark]);

  const variables = useMemo(() => toCssVariables(tokens), [tokens]);

  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(variables)) root.style.setProperty(name, value);
  }, [variables]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.colorScheme = isDark ? "dark" : "light";
    root.classList.toggle("dark", isDark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tokens.canvas);
  }, [isDark, tokens.canvas]);

  return <ThemeTokenContext.Provider value={tokens}>{children}</ThemeTokenContext.Provider>;
}
