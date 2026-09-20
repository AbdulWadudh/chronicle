import { type ClientMessage, clientMessageSchema } from "./client";
import { type ServerMessage, serverMessageSchema } from "./server";

export * from "./client";
export * from "./envelope";
export * from "./server";

export type ParseResult<T> = { ok: true; message: T } | { ok: false; reason: string };

function parseWith<T>(
  schema: { safeParse: (input: unknown) => { success: boolean; data?: T; error?: unknown } },
  raw: string,
): ParseResult<T> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "payload is not valid JSON" };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success || parsed.data === undefined) {
    return { ok: false, reason: "payload does not match the protocol schema" };
  }
  return { ok: true, message: parsed.data };
}

export function parseClientMessage(raw: string): ParseResult<ClientMessage> {
  return parseWith<ClientMessage>(clientMessageSchema, raw);
}

export function parseServerMessage(raw: string): ParseResult<ServerMessage> {
  return parseWith<ServerMessage>(serverMessageSchema, raw);
}

export function encode(message: ClientMessage | ServerMessage): string {
  return JSON.stringify(message);
}
