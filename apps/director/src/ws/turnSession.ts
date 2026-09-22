import { loadSettings, newId } from "@chronicle/db";
import { PROTOCOL_VERSION, type TurnNode } from "@chronicle/utils";
import type { ResolvedCheck } from "~/engine/adjudicator";
import { resolveInteractingCharacters, summarizeWorldCast } from "~/engine/castResolution";
import { planTurn } from "~/engine/choices";
import { closeBuffer } from "~/ws/buffer";
import { playEnsembleTurn } from "~/ws/ensembleTurn";
import { ownTurn } from "~/ws/media";
import {
  adjudicate,
  dispatchScene,
  FIRST_VARIANT,
  type StartTurnInput,
  streamNarrative,
  toNarrativeRequest,
} from "~/ws/narration";
import { beginTurn, finishTurn, send } from "~/ws/session";
import {
  commitTurn,
  dispatchAudio,
  enqueueSentenceAudio,
  narratedSentences,
} from "~/ws/turnOutput";

export {
  adjudicate,
  commitTurn,
  dispatchAudio,
  dispatchScene,
  enqueueSentenceAudio,
  narratedSentences,
  type StartTurnInput,
  streamNarrative,
  toNarrativeRequest,
};

async function playSoloTurn(
  input: StartTurnInput,
  turnId: string,
  check: ResolvedCheck | null,
  signal: AbortSignal,
): Promise<TurnNode> {
  const { context } = input;
  const recentContext = [
    input.action,
    context.ancestry.at(-1)?.playerAction ?? "",
    context.ancestry.at(-1)?.narrativeText ?? "",
  ].join(" ");

  const cast = await resolveInteractingCharacters(
    context.db,
    context.world.id,
    context.character.id,
    recentContext,
    input.mentionedCharacterIds,
  );
  const castSummary = await summarizeWorldCast(context.db, context.world.id, context.character.id);

  const narrative = await streamNarrative(input, turnId, check, signal, cast, castSummary);
  await dispatchAudio(context, turnId, narrative);

  const plan = await planTurn(narrative, signal, cast, input.action);
  await dispatchScene(
    input.socket,
    input.replyTo,
    context,
    turnId,
    narrative,
    plan.sceneShape,
    FIRST_VARIANT,
    cast,
    plan.sceneVisual,
  );
  return commitTurn(input, turnId, narrative, check, plan);
}

export async function runTurn(input: StartTurnInput): Promise<void> {
  const { socket, replyTo, context } = input;
  const turnId = newId();
  ownTurn(turnId, socket);
  const signal = beginTurn(turnId);

  send(socket, {
    v: PROTOCOL_VERSION,
    replyTo,
    type: "TURN_INITIALIZED",
    turnId,
    parentId: input.parentTurnId,
  });

  try {
    const check = await adjudicate(input, turnId, signal);
    const settings = await loadSettings();
    const ensembleOn = context.world.ensembleEnabled && settings.ensemble.enabled;

    const turn =
      (ensembleOn ? await playEnsembleTurn(input, turnId, check, signal) : null) ??
      (await playSoloTurn(input, turnId, check, signal));

    send(socket, { v: PROTOCOL_VERSION, replyTo, type: "TURN_COMMITTED", turn });
  } catch (error) {
    if (signal.aborted) {
      send(socket, {
        v: PROTOCOL_VERSION,
        replyTo,
        type: "ERROR",
        code: "ABORTED",
        turnId,
        message: "Turn aborted.",
      });
    } else {
      send(socket, {
        v: PROTOCOL_VERSION,
        replyTo,
        type: "ERROR",
        code: "UPSTREAM",
        turnId,
        message: error instanceof Error ? error.message : "Turn generation failed.",
      });
    }
  } finally {
    finishTurn(turnId);
    closeBuffer(turnId);
  }
}
