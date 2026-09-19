import type { ThemeTokens } from "@chronicle/shared";
import { VariableContextProvider } from "nativewind";
import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";
import { useResolvedTheme, useThemeStore } from "./store";
import { toCssVariables } from "./tokens";

const ThemeTokenContext = createContext<ThemeTokens | null>(null);

export function useThemeTokens(): ThemeTokens {
  const tokens = useContext(ThemeTokenContext);
  if (tokens === null) throw new Error("useThemeTokens must be used inside ThemeEngine");
  return tokens;
}

export function ThemeEngine({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const setSystemIsDark = useThemeStore((state) => state.setSystemIsDark);
  const tokens = useResolvedTheme();

  useEffect(() => {
    setSystemIsDark(scheme !== "light");
  }, [scheme, setSystemIsDark]);

  const variables = useMemo(() => toCssVariables(tokens), [tokens]);

  return (
    <ThemeTokenContext.Provider value={tokens}>
      <VariableContextProvider value={variables}>{children}</VariableContextProvider>
    </ThemeTokenContext.Provider>
  );
}
