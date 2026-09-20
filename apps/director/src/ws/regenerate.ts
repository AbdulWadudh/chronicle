import { db, schema, toTurnNode } from "@chronicle/db";
import { PROTOCOL_VERSION } from "@chronicle/utils";
import { eq } from "drizzle-orm";
import { proposeChoices } from "~/engine/choices";
import { enqueueScene } from "~/engine/imagery";
import { loadTurnContext } from "~/ws/loader";
import { ownTurn } from "~/ws/media";
import { beginTurn, type ChronicleSocket, finishTurn, send, sendError } from "~/ws/session";
import { dispatchMedia, enqueueSentenceAudio, streamNarrative } from "~/ws/turnSession";

const FIRST_VARIANT = 1;

export type RegenerateTarget = "narrative" | "visual" | "audio";

export function nextVariant(sceneImageUrl: string | null): number {
  if (sceneImageUrl === null) return FIRST_VARIANT;
  const matched = /scene-(\d+)\.png/u.exec(sceneImageUrl);
  const current = matched === null ? FIRST_VARIANT : Number(matched[1]);
  return Number.isFinite(current) ? current + 1 : FIRST_VARIANT;
}

export async function regenerateTurn(
  socket: ChronicleSocket,
  replyTo: string,
  turnId: string,
  target: RegenerateTarget,
): Promise<void> {
  const row = await db.select().from(schema.turns).where(eq(schema.turns.id, turnId)).get();
  if (row === undefined) {
    sendError(socket, replyTo, "NOT_FOUND", "That turn no longer exists.", turnId);
    return;
  }

  const context = await loadTurnContext(row.characterId, socket.data.userId, row.parentId);
  if (context === null) {
    sendError(socket, replyTo, "NOT_FOUND", "That story is not yours.", turnId);
    return;
  }

  ownTurn(turnId, socket);

  if (target === "audio") {
    await db.update(schema.turns).set({ audioUrlsJson: [] }).where(eq(schema.turns.id, turnId));
    await enqueueSentenceAudio(context, turnId, row.narrativeText);
    send(socket, { v: PROTOCOL_VERSION, replyTo, type: "TURN_COMMITTED", turn: toTurnNode(row) });
    return;
  }

  if (target === "visual") {
    await enqueueScene(
      context.world,
      context.character,
      turnId,
      row.narrativeText,
      nextVariant(row.sceneImageUrl),
    );
    send(socket, { v: PROTOCOL_VERSION, replyTo, type: "TURN_COMMITTED", turn: toTurnNode(row) });
    return;
  }

  const stored = row.diceCheckJson;
  const check =
    stored === null
      ? null
      : {
          ...stored,
          total: (stored.roll ?? 0) + stored.baseModifier,
          critical: null,
        };

  const signal = beginTurn(turnId);
  send(socket, {
    v: PROTOCOL_VERSION,
    replyTo,
    type: "TURN_INITIALIZED",
    turnId,
    parentId: row.parentId,
  });

  try {
    const narrative = await streamNarrative(
      {
        socket,
        replyTo,
        context,
        parentTurnId: row.parentId,
        action: row.playerAction,
        mode: "scratch",
        directorWhisper: null,
      },
      turnId,
      check,
      signal,
    );

    const choices = await proposeChoices(narrative, signal);
    const [updated] = await db
      .update(schema.turns)
      .set({
        narrativeText: narrative,
        choicesJson: choices,
        audioUrlsJson: [],
        sceneImageUrl: null,
      })
      .where(eq(schema.turns.id, turnId))
      .returning();
    if (updated === undefined) throw new Error("The rewritten turn was not saved");

    await dispatchMedia(context, turnId, narrative, nextVariant(row.sceneImageUrl));
    send(socket, {
      v: PROTOCOL_VERSION,
      replyTo,
      type: "TURN_COMMITTED",
      turn: toTurnNode(updated),
    });
  } catch (error) {
    const aborted = signal.aborted;
    sendError(
      socket,
      replyTo,
      aborted ? "ABORTED" : "UPSTREAM",
      aborted ? "Rewrite aborted." : error instanceof Error ? error.message : "Rewrite failed.",
      turnId,
    );
  } finally {
    finishTurn(turnId);
  }
}
