import { db, schema } from "@chronicle/db";
import { type ClientMessage, PROTOCOL_VERSION, parseClientMessage } from "@chronicle/utils";
import { eq } from "drizzle-orm";
import { replayFrom } from "~/ws/buffer";
import { loadTurnContext } from "~/ws/loader";
import { startMediaRelay } from "~/ws/media";
import { regenerateTurn } from "~/ws/regenerate";
import {
  type ChronicleSocket,
  cancelTurn,
  forgetSocket,
  registerSocket,
  send,
  sendError,
} from "~/ws/session";
import { runTurn } from "~/ws/turnSession";

export function websocketHandlers(): {
  open: (socket: ChronicleSocket) => void;
  close: (socket: ChronicleSocket) => void;
  message: (socket: ChronicleSocket, raw: string | Buffer) => void;
} {
  return {
    open(socket) {
      startMediaRelay();
      registerSocket(socket);
    },
    close(socket) {
      forgetSocket(socket);
    },
    message(socket, raw) {
      const parsed = parseClientMessage(typeof raw === "string" ? raw : raw.toString());
      if (!parsed.ok) {
        sendError(socket, null, "BAD_REQUEST", parsed.reason);
        return;
      }
      void dispatch(socket, parsed.message);
    },
  };
}

async function dispatch(socket: ChronicleSocket, message: ClientMessage): Promise<void> {
  switch (message.type) {
    case "PING":
      send(socket, { v: PROTOCOL_VERSION, replyTo: message.msgId, type: "PONG" });
      return;

    case "ABORT_TURN": {
      const cancelled = cancelTurn(message.turnId);
      if (!cancelled) {
        sendError(socket, message.msgId, "NOT_FOUND", "No active turn.", message.turnId);
      }
      return;
    }

    case "RESUME_TURN": {
      for (const buffered of replayFrom(message.turnId, message.fromSentenceIndex)) {
        socket.send(JSON.stringify(buffered));
      }
      return;
    }

    case "REGENERATE":
      await regenerateTurn(socket, message.msgId, message.turnId, message.target);
      return;

    case "SUBMIT_ACTION":
      await startTurn(
        socket,
        message.msgId,
        message.parentTurnId,
        message.action,
        message.mode,
        message.directorWhisper,
      );
      return;

    case "SELECT_CHOICE": {
      const label = await choiceLabel(message.parentTurnId, message.choiceIndex);
      if (label === null) {
        sendError(socket, message.msgId, "NOT_FOUND", "That choice is no longer offered.");
        return;
      }
      await startTurn(
        socket,
        message.msgId,
        message.parentTurnId,
        label,
        "scratch",
        message.directorWhisper,
      );
      return;
    }

    default:
      sendError(socket, message.msgId, "BAD_REQUEST", `Unhandled message ${message.type}.`);
  }
}

async function startTurn(
  socket: ChronicleSocket,
  replyTo: string,
  parentTurnId: string | null,
  action: string,
  mode: "scratch" | "enhanced",
  directorWhisper: string | null,
): Promise<void> {
  const characterId = socket.data.characterId;
  if (characterId === null) {
    sendError(socket, replyTo, "BAD_REQUEST", "No character selected for this connection.");
    return;
  }
  const context = await loadTurnContext(characterId, socket.data.userId, parentTurnId);
  if (context === null) {
    sendError(socket, replyTo, "NOT_FOUND", "Character or world not found.");
    return;
  }
  await runTurn({ socket, replyTo, context, parentTurnId, action, mode, directorWhisper });
}

async function choiceLabel(parentTurnId: string, choiceIndex: number): Promise<string | null> {
  const row = await db
    .select({ choicesJson: schema.turns.choicesJson })
    .from(schema.turns)
    .where(eq(schema.turns.id, parentTurnId))
    .get();
  return row?.choicesJson[choiceIndex]?.label ?? null;
}
