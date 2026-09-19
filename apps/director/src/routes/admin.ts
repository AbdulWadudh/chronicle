import { API } from "@chronicle/shared";
import { Hono } from "hono";
import { type AuthEnv, requireOwner, requireSession } from "~/auth";
import { settingsRoutes } from "~/routes/settings";

export const adminRoutes = new Hono<AuthEnv>()
  .use("*", requireSession)
  .use("*", requireOwner)
  .get("/", (context) => {
    const user = context.get("user");
    return context.json({ isOwner: true, email: user.email, name: user.name });
  })
  .route("/settings", settingsRoutes);

export const ADMIN_BASE_PATH = API.admin;
