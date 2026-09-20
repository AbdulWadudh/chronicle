import { API } from "@chronicle/config";
import { AUTH_BASE_PATH } from "@chronicle/db";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { type AuthEnv, getAuth } from "~/auth";
import { accountRoutes } from "~/routes/account";
import { adminRoutes } from "~/routes/admin";
import { characterRoutes } from "~/routes/characters";
import { settingsRoutes } from "~/routes/settings";
import { themeRoutes } from "~/routes/themes";
import { turnRoutes } from "~/routes/turns";
import { worldRoutes } from "~/routes/worlds";
import { serveStage } from "~/static";
import { activeTurnCount, connectionCount } from "~/ws/session";

export function createApp(): Hono<AuthEnv> {
  const app = new Hono<AuthEnv>();

  app.use("*", logger());
  app.use("*", cors({ origin: (origin) => origin, credentials: true }));

  app.get(API.health, (context) =>
    context.json({
      status: "ok",
      connections: connectionCount(),
      activeTurns: activeTurnCount(),
    }),
  );

  app.on(["GET", "POST"], `${AUTH_BASE_PATH}/*`, async (context) => {
    const auth = await getAuth();
    return auth.handler(context.req.raw);
  });

  app.route(API.worlds, worldRoutes);
  app.route(API.characters, characterRoutes);
  app.route(API.turns, turnRoutes);
  app.route(API.settings, settingsRoutes);
  app.route(API.themes, themeRoutes);
  app.route(API.account, accountRoutes);
  app.route(API.admin, adminRoutes);

  app.all("/api/*", (context) => context.json({ error: "Not found." }, 404));
  app.get("*", serveStage);
  app.notFound((context) => context.json({ error: "Not found." }, 404));
  return app;
}
