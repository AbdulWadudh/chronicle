import type { ThemeTokens } from "@chronicle/config";

export function mergeThemeTokens(base: ThemeTokens, overrides: Partial<ThemeTokens>): ThemeTokens {
  return { ...base, ...overrides };
}
