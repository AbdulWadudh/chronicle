import { DEFAULT_THEME_TOKENS } from "@chronicle/config";
import { z } from "zod";

const TOKEN_KEYS = Object.keys(DEFAULT_THEME_TOKENS) as [string, ...string[]];

export const tokenPatchSchema = z.partialRecord(
  z.enum(TOKEN_KEYS),
  z.union([z.string().max(200), z.number().finite()]),
);

export const paletteOverridesSchema = z.object({
  mode: z.enum(["dark", "light"]).optional(),
  dark: tokenPatchSchema,
  light: tokenPatchSchema,
  shared: tokenPatchSchema.default({}),
});
