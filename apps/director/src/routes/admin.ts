import { API } from "@chronicle/config";
import { listAccounts, setRole } from "@chronicle/db";
import { Hono } from "hono";
import { z } from "zod";
import { type AuthEnv, requireAdmin, requireSession } from "~/auth";
import { healthRoutes } from "~/routes/health";
import { settingsRoutes } from "~/routes/settings";

const roleBody = z.object({ role: z.enum(["user", "admin"]) });

export const adminRoutes = new Hono<AuthEnv>()
  .use("*", requireSession)
  .use("*", requireAdmin)
  .get("/", (context) => {
    const user = context.get("user");
    return context.json({ role: "admin", email: user.email, name: user.name });
  })
  .get("/accounts", async (context) => {
    const accounts = await listAccounts();
    return context.json({ accounts, currentUserId: context.get("user").id });
  })
  .patch("/accounts/:id", async (context) => {
    const parsed = roleBody.safeParse(await context.req.json().catch(() => null));
    if (!parsed.success) return context.json({ error: "Expected a role of user or admin." }, 400);

    const result = await setRole(context.req.param("id"), parsed.data.role);
    if (!result.ok) return context.json({ error: result.reason }, 409);
    return context.json({ role: result.role });
  })
  .route("/health", healthRoutes)
  .route("/settings", settingsRoutes);

export const ADMIN_BASE_PATH = API.admin;
