import { loadSettings, resetSettings, updateSettings } from "@chronicle/db";
import {
  DEFAULT_RUNTIME_SETTINGS,
  RUNTIME_SETTING_GROUPS,
  runtimeSettingsPatchSchema,
} from "@chronicle/shared";
import { Hono } from "hono";
import { type AuthEnv, requireSession } from "../auth";
import { publishSettingsChange } from "../queue";

export const settingsRoutes = new Hono<AuthEnv>()
  .use("*", requireSession)
  .get("/", async (context) =>
    context.json({
      settings: await loadSettings(),
      defaults: DEFAULT_RUNTIME_SETTINGS,
      groups: RUNTIME_SETTING_GROUPS,
    }),
  )
  .patch("/", async (context) => {
    const body = runtimeSettingsPatchSchema.safeParse(await context.req.json().catch(() => null));
    if (!body.success) {
      return context.json({ error: "Invalid settings patch.", issues: body.error.issues }, 400);
    }
    const user = context.get("user");
    const next = await updateSettings(body.data, user.id);
    await publishSettingsChange();
    return context.json({ settings: next });
  })
  .post("/reset", async (context) => {
    const user = context.get("user");
    const next = await resetSettings(user.id);
    await publishSettingsChange();
    return context.json({ settings: next });
  });
