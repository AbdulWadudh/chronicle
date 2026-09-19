import { type ErrorCode, PROTOCOL_VERSION, type ServerMessage } from "@chronicle/shared";
import type { ServerWebSocket } from "bun";
import { record } from "./buffer";

export interface SocketData {
  userId: string;
  sessionId: string;
  characterId: string | null;
}

export type ChronicleSocket = ServerWebSocket<SocketData>;

const aborts = new Map<string, AbortController>();
const sockets = new Set<ChronicleSocket>();

export function registerSocket(socket: ChronicleSocket): void {
  sockets.add(socket);
}

export function forgetSocket(socket: ChronicleSocket): void {
  sockets.delete(socket);
}

export function send(socket: ChronicleSocket, message: ServerMessage): void {
  socket.send(JSON.stringify(message));
  if ("turnId" in message && typeof message.turnId === "string") {
    record(message.turnId, message);
  }
}

export function sendError(
  socket: ChronicleSocket,
  replyTo: string | null,
  code: ErrorCode,
  message: string,
  turnId: string | null = null,
): void {
  send(socket, { v: PROTOCOL_VERSION, replyTo, type: "ERROR", code, turnId, message });
}

export function beginTurn(turnId: string): AbortSignal {
  cancelTurn(turnId);
  const controller = new AbortController();
  aborts.set(turnId, controller);
  return controller.signal;
}

export function cancelTurn(turnId: string): boolean {
  const controller = aborts.get(turnId);
  if (controller === undefined) return false;
  controller.abort();
  aborts.delete(turnId);
  return true;
}

export function finishTurn(turnId: string): void {
  aborts.delete(turnId);
}

export function activeTurnCount(): number {
  return aborts.size;
}

export function connectionCount(): number {
  return sockets.size;
}
