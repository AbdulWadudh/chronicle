import { loadSettings, newId } from "@chronicle/db";
import { type Character, type ImageShape, PROTOCOL_VERSION } from "@chronicle/utils";
import {
  type AdjudicationDecision,
  CHECK_PROPOSAL_SCHEMA,
  type CheckProposal,
  type ResolvedCheck,
  resolveCheck,
} from "~/engine/adjudicator";
import { resolveInteractingCharacters, summarizeWorldCast } from "~/engine/castResolution";
import { planTurn } from "~/engine/choices";
import { enqueueScene } from "~/engine/imagery";
import { completeStructured, streamChat } from "~/engine/llm";
import { buildCheckPrompt, buildNarrativePrompt } from "~/engine/prompt";
import { closeBuffer } from "~/ws/buffer";
import type { TurnContext } from "~/ws/context";
import { ownTurn } from "~/ws/media";
import { beginTurn, type ChronicleSocket, finishTurn, send } from "~/ws/session";
import { commitTurn, dispatchAudio, enqueueSentenceAudio } from "~/ws/turnOutput";

export { commitTurn, dispatchAudio, enqueueSentenceAudio };

const FIRST_VARIANT = 1;

export interface StartTurnInput {
  socket: ChronicleSocket;
  replyTo: string;
  context: TurnContext;
  parentTurnId: string | null;
  action: string;
  mode: "scratch" | "enhanced";
  directorWhisper: string | null;
  mentionedCharacterIds?: readonly string[];
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
    const castSummary = await summarizeWorldCast(
      context.db,
      context.world.id,
      context.character.id,
    );
    const check = await adjudicate(input, turnId, signal);
    const narrative = await streamNarrative(input, turnId, check, signal, cast, castSummary);
    await dispatchAudio(context, turnId, narrative);
    const plan = await planTurn(narrative, signal, cast, input.action);
    await dispatchScene(
      socket,
      replyTo,
      context,
      turnId,
      narrative,
      plan.sceneShape,
      FIRST_VARIANT,
      cast,
      plan.sceneVisual,
    );
    const turn = await commitTurn(input, turnId, narrative, check, plan);
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

export async function adjudicate(
  input: StartTurnInput,
  turnId: string,
  signal: AbortSignal,
): Promise<ResolvedCheck | null> {
  const settings = await loadSettings();
  const messages = buildCheckPrompt(toNarrativeRequest(input, null));
  const decision = await completeStructured<AdjudicationDecision>(messages, {
    schemaName: "check_proposal",
    schema: CHECK_PROPOSAL_SCHEMA,
    signal,
  });

  if (!decision.requiresCheck || decision.stat === undefined) return null;
  const stats = input.context.character.stats;
  if (!Object.hasOwn(stats, decision.stat)) return null;

  const proposal: CheckProposal = {
    stat: decision.stat,
    dc: decision.dc ?? settings.dice.defaultDifficulty,
    reason: decision.reason ?? "",
  };
  const resolved = resolveCheck(newId(), proposal, stats);

  send(input.socket, {
    v: PROTOCOL_VERSION,
    replyTo: input.replyTo,
    type: "DICE_CHECK_REQUIRED",
    turnId,
    checkId: resolved.checkId,
    stat: resolved.stat,
    dc: resolved.dc,
    baseModifier: resolved.baseModifier,
    roll: resolved.roll ?? 1,
    succeeded: resolved.succeeded ?? false,
  });
  return resolved;
}

export async function streamNarrative(
  input: StartTurnInput,
  turnId: string,
  check: ResolvedCheck | null,
  signal: AbortSignal,
  interactingCharacters: readonly Character[] = [],
  castSummary: string | null = null,
): Promise<string> {
  const outcome =
    check === null ? null : `${check.stat} check ${check.succeeded ? "succeeded" : "failed"}`;
  const settings = await loadSettings();
  const request = toNarrativeRequest(input, outcome, interactingCharacters, castSummary);
  const messages = buildNarrativePrompt(request, settings.prompt);

  let narrative = "";
  for await (const token of streamChat(messages, {
    signal,
    thinking: input.mode === "enhanced",
  })) {
    narrative += token;
    send(input.socket, {
      v: PROTOCOL_VERSION,
      replyTo: input.replyTo,
      type: "NARRATIVE_CHUNK",
      turnId,
      token,
    });
  }
  return narrative.trim();
}

export async function dispatchScene(
  socket: ChronicleSocket,
  replyTo: string,
  context: TurnContext,
  turnId: string,
  narrative: string,
  shape: ImageShape,
  variant: number = FIRST_VARIANT,
  interactingCharacters: readonly Character[] = [],
  subject?: string,
): Promise<void> {
  await enqueueScene(
    context.world,
    context.character,
    turnId,
    narrative,
    shape,
    variant,
    subject,
    interactingCharacters,
  );
  send(socket, { v: PROTOCOL_VERSION, replyTo, type: "SCENE_PLANNED", turnId, shape });
}

export function toNarrativeRequest(
  input: StartTurnInput,
  checkOutcome: string | null,
  interactingCharacters: readonly Character[] = [],
  castSummary: string | null = null,
) {
  return {
    world: input.context.world,
    character: input.context.character,
    state: input.context.state,
    ancestry: input.context.ancestry,
    action: input.action,
    mode: input.mode,
    checkOutcome,
    directorWhisper: input.directorWhisper,
    interactingCharacters,
    castSummary,
  };
}
