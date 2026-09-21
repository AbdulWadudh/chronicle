import { join, relative, resolve, sep } from "node:path";
import { env } from "@chronicle/config/env";
import type { Context } from "hono";

const INDEX = "index.html";
const NO_CLIENT =
  "No built client is configured on this director. In development, open the Vite dev server instead. For an installed build, run the stage build and set STAGE_DIST to its dist folder.";

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
  const dist = env().STAGE_DIST;
  if (dist === undefined) return context.text(NO_CLIENT, 404);
  const root = resolve(dist);
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
