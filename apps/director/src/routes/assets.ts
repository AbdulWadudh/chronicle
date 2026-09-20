import { env } from "@chronicle/config/env";
import { Hono } from "hono";
import { type AuthEnv, requireSession } from "~/auth";

function assetOrigin(): string {
  const { STORAGE_ENDPOINT, STORAGE_BUCKET_ASSETS } = env();
  return `${STORAGE_ENDPOINT.replace(/\/+$/u, "")}/${STORAGE_BUCKET_ASSETS}/`;
}

export const assetRoutes = new Hono<AuthEnv>()
  .use("*", requireSession)
  .get("/", async (context) => {
    const requested = new URL(context.req.url).searchParams.get("url");
    if (requested === null) return context.json({ error: "url is required." }, 400);

    const prefix = assetOrigin();
    const target = requested.split("?")[0] ?? requested;
    if (!target.startsWith(prefix) || target.includes("..")) {
      return context.json({ error: "That is not a Chronicle asset." }, 403);
    }

    const upstream = await fetch(target).catch(() => null);
    if (upstream === null || !upstream.ok || upstream.body === null) {
      return context.json({ error: "The asset could not be read." }, 502);
    }

    const filename = target.split("/").pop() ?? "chronicle.png";
    return new Response(upstream.body, {
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  });
