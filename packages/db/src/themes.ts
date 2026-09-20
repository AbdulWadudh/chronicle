import { type PaletteOverrides, THEME_PALETTES, type ThemePalette } from "@chronicle/utils";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "./db";
import { themePalettes } from "./schema/theme";

export async function seedThemePalettes(): Promise<number> {
  const updatedAt = new Date();
  for (const [index, palette] of THEME_PALETTES.entries()) {
    const row = {
      id: palette.id,
      name: palette.name,
      blurb: palette.blurb,
      overridesJson: palette.overrides,
      builtIn: true,
      sortOrder: index,
      updatedAt,
    };
    await db
      .insert(themePalettes)
      .values(row)
      .onConflictDoUpdate({ target: themePalettes.id, set: row });
  }
  return THEME_PALETTES.length;
}

export async function listThemePalettes(): Promise<ThemePalette[]> {
  const rows = await db
    .select({
      id: themePalettes.id,
      name: themePalettes.name,
      blurb: themePalettes.blurb,
      overridesJson: themePalettes.overridesJson,
    })
    .from(themePalettes)
    .orderBy(asc(themePalettes.sortOrder))
    .all();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    blurb: row.blurb,
    overrides: row.overridesJson satisfies PaletteOverrides,
  }));
}

export interface NewThemePalette {
  name: string;
  blurb: string;
  overrides: PaletteOverrides;
}

export async function createThemePalette(palette: NewThemePalette): Promise<ThemePalette> {
  const saved = await db
    .select({ total: count() })
    .from(themePalettes)
    .where(eq(themePalettes.builtIn, false))
    .get();

  const row = {
    id: Bun.randomUUIDv7(),
    name: palette.name,
    blurb: palette.blurb,
    overridesJson: palette.overrides,
    builtIn: false,
    sortOrder: 1000 + (saved?.total ?? 0),
    updatedAt: new Date(),
  };

  await db.insert(themePalettes).values(row);
  return { id: row.id, name: row.name, blurb: row.blurb, overrides: row.overridesJson };
}

export interface ThemePalettePatch {
  name?: string;
  overrides?: PaletteOverrides;
}

export async function updateThemePalette(
  id: string,
  patch: ThemePalettePatch,
): Promise<ThemePalette | null> {
  await db
    .update(themePalettes)
    .set({
      ...(patch.name === undefined ? {} : { name: patch.name }),
      ...(patch.overrides === undefined ? {} : { overridesJson: patch.overrides }),
      updatedAt: new Date(),
    })
    .where(and(eq(themePalettes.id, id), eq(themePalettes.builtIn, false)));

  const row = await db
    .select({
      id: themePalettes.id,
      name: themePalettes.name,
      blurb: themePalettes.blurb,
      overridesJson: themePalettes.overridesJson,
      builtIn: themePalettes.builtIn,
    })
    .from(themePalettes)
    .where(eq(themePalettes.id, id))
    .get();

  if (row === undefined || row.builtIn) return null;
  return { id: row.id, name: row.name, blurb: row.blurb, overrides: row.overridesJson };
}

export async function deleteThemePalette(id: string): Promise<boolean> {
  const existing = await db
    .select({ builtIn: themePalettes.builtIn })
    .from(themePalettes)
    .where(eq(themePalettes.id, id))
    .get();

  if (existing === undefined || existing.builtIn) return false;
  await db.delete(themePalettes).where(eq(themePalettes.id, id));
  return true;
}
