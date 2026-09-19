import {
  type ClientMessage,
  PROTOCOL_VERSION,
  parseServerMessage,
  type ServerMessage,
} from "@chronicle/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { websocketUrl } from "~/lib/api";
import { readToken } from "~/lib/session";

const HEARTBEAT_MS = 25_000;
const RECONNECT_BASE_MS = 800;
const RECONNECT_MAX_MS = 15_000;

export type SocketStatus = "idle" | "connecting" | "open" | "closed";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type Outbound = DistributiveOmit<ClientMessage, "v" | "msgId">;

export interface GameSocket {
  status: SocketStatus;
  send: (message: Outbound) => string | null;
  lastError: string | null;
}

function nextMessageId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function useGameSocket(
  characterId: string | null,
  onMessage: (message: ServerMessage) => void,
): GameSocket {
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  const send = useCallback((message: Outbound): string | null => {
    const socket = socketRef.current;
    if (socket === null || socket.readyState !== WebSocket.OPEN) return null;
    const msgId = nextMessageId();
    socket.send(JSON.stringify({ ...message, v: PROTOCOL_VERSION, msgId }));
    return msgId;
  }, []);

  useEffect(() => {
    if (characterId === null) return;
    let disposed = false;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;

    async function connect(): Promise<void> {
      const token = readToken();
      if (token === null || disposed) return;

      setStatus("connecting");
      const socket = new WebSocket(websocketUrl(token, characterId));
      socketRef.current = socket;

      socket.onopen = () => {
        attemptRef.current = 0;
        setStatus("open");
        setLastError(null);
        heartbeat = setInterval(() => send({ type: "PING" }), HEARTBEAT_MS);
      };

      socket.onmessage = (event) => {
        const parsed = parseServerMessage(String(event.data));
        if (parsed.ok) handlerRef.current(parsed.message);
        else setLastError(parsed.reason);
      };

      socket.onerror = () => setLastError("WebSocket error");

      socket.onclose = () => {
        if (heartbeat !== null) clearInterval(heartbeat);
        socketRef.current = null;
        setStatus("closed");
        if (disposed) return;
        attemptRef.current += 1;
        const delay = Math.min(RECONNECT_BASE_MS * 2 ** attemptRef.current, RECONNECT_MAX_MS);
        retry = setTimeout(() => void connect(), delay);
      };
    }

    void connect();

    return () => {
      disposed = true;
      if (heartbeat !== null) clearInterval(heartbeat);
      if (retry !== null) clearTimeout(retry);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [characterId, send]);

  return { status, send, lastError };
}
