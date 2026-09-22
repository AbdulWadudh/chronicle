import {
  createThemePalette,
  deleteThemePalette,
  listThemePalettes,
  updateThemePalette,
} from "@chronicle/db";
import type { PaletteOverrides } from "@chronicle/utils";
import { faker } from "@faker-js/faker";
import { Hono } from "hono";
import { z } from "zod";
import { type AuthEnv, requireSession } from "~/auth";
import { tokenPatchSchema as tokenPatch } from "~/themeTokens";

const patchBody = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    overrides: z.object({ dark: tokenPatch, light: tokenPatch }).optional(),
  })
  .refine((body) => body.name !== undefined || body.overrides !== undefined, {
    message: "Send a name, overrides, or both.",
  });

const saveBody = z.object({
  name: z.string().trim().max(60).optional(),
  overrides: z.object({ dark: tokenPatch, light: tokenPatch }),
});

function titleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => (word === "" ? word : `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`))
    .join(" ");
}

function inventName(): string {
  return titleCase(`${faker.color.human()} ${faker.word.adjective()} ${faker.animal.type()}`);
}

export const themeRoutes = new Hono<AuthEnv>()
  .use("*", requireSession)
  .get("/", async (context) => context.json({ palettes: await listThemePalettes() }))
  .post("/", async (context) => {
    const parsed = saveBody.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) {
      return context.json({ error: "That theme payload is not a set of theme tokens." }, 400);
    }

    const chosen = parsed.data.name ?? "";
    const palette = await createThemePalette({
      name: chosen === "" ? inventName() : chosen,
      blurb: `Saved from your own edits on ${new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}.`,
      overrides: parsed.data.overrides as PaletteOverrides,
    });

    return context.json({ palette }, 201);
  })
  .patch("/:id", async (context) => {
    const parsed = patchBody.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) return context.json({ error: "A theme needs a name or tokens." }, 400);

    const palette = await updateThemePalette(context.req.param("id"), {
      name: parsed.data.name,
      overrides: parsed.data.overrides as PaletteOverrides | undefined,
    });
    if (palette === null) {
      return context.json({ error: "Only a theme you saved can be renamed." }, 404);
    }
    return context.json({ palette });
  })
  .delete("/:id", async (context) => {
    const removed = await deleteThemePalette(context.req.param("id"));
    if (!removed) return context.json({ error: "Only a theme you saved can be deleted." }, 404);
    return context.body(null, 204);
  });
