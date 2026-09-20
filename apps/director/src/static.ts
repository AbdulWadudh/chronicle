import { join, relative, resolve, sep } from "node:path";
import { env } from "@chronicle/config/env";
import type { Context } from "hono";

const INDEX = "index.html";

function withinRoot(root: string, candidate: string): boolean {
  const offset = relative(root, candidate);
  return offset.length > 0 && !offset.startsWith("..") && !offset.startsWith(`${sep}..`);
}

function requestedFile(root: string, pathname: string): string | null {
  const decoded = decodeURIComponent(pathname);
  if (decoded === "/") return join(root, INDEX);
  const candidate = resolve(root, `.${decoded}`);
  return withinRoot(root, candidate) ? candidate : null;
}

export async function serveStage(context: Context): Promise<Response> {
  const root = resolve(env().STAGE_DIST);
  const target = requestedFile(root, new URL(context.req.url).pathname);

  if (target !== null) {
    const asset = Bun.file(target);
    if (await asset.exists()) return new Response(asset);
  }

  const shell = Bun.file(join(root, INDEX));
  if (await shell.exists()) {
    return new Response(shell, { headers: { "cache-control": "no-cache" } });
  }

  return context.json({ error: "Not found." }, 404);
}
