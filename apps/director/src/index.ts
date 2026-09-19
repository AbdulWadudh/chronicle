import { env } from "@chronicle/config";
import { runMigrations } from "@chronicle/db";
import { API } from "@chronicle/shared";
import { createApp } from "~/app";
import { verifyToken } from "~/auth";
import { websocketHandlers } from "~/ws/gateway";
import type { SocketData } from "~/ws/session";

await runMigrations();

const app = createApp();
const configuration = env();

const server = Bun.serve<SocketData, never>({
  port: configuration.DIRECTOR_PORT,
  idleTimeout: configuration.WS_IDLE_TIMEOUT_SECONDS,
  async fetch(request, bunServer) {
    const url = new URL(request.url);
    if (url.pathname !== API.ws) return app.fetch(request);

    const token = url.searchParams.get("token");
    if (token === null) return new Response("Missing token", { status: 401 });

    const session = await verifyToken(token);
    if (session === null) return new Response("Unauthorized", { status: 401 });

    const data: SocketData = {
      userId: session.user.id,
      sessionId: session.sessionId,
      characterId: url.searchParams.get("characterId"),
    };
    if (bunServer.upgrade(request, { data })) return undefined as unknown as Response;
    return new Response("WebSocket upgrade failed", { status: 400 });
  },
  websocket: websocketHandlers(),
});

console.log(`director listening on http://localhost:${server.port}`);
console.log(`websocket at ws://localhost:${server.port}${API.ws}`);
