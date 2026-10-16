import { loadSettings, newId } from "@chronicle/db";
import { type Character, type ImageShape, PROTOCOL_VERSION } from "@chronicle/utils";
import {
  type AdjudicationDecision,
  CHECK_PROPOSAL_SCHEMA,
  type CheckProposal,
  type ResolvedCheck,
  resolveCheck,
} from "~/engine/adjudicator";
import { enqueueScene } from "~/engine/imagery";
import { completeStructured, streamChat } from "~/engine/llm";
import { buildCheckPrompt, buildNarrativePrompt } from "~/engine/prompt";
import type { TurnContext } from "~/ws/context";
import { type ChronicleSocket, send } from "~/ws/session";

export const FIRST_VARIANT = 1;

export interface StartTurnInput {
  socket: ChronicleSocket;
  replyTo: string;
  context: TurnContext;
  parentTurnId: string | null;
  action: string;
  mode: "scratch" | "enhanced";
  directorWhisper: string | null;
  mentionedCharacterIds?: readonly string[];
  recalled?: readonly string[];
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
    recalled: input.recalled ?? [],
  };
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

export function checkOutcomeOf(check: ResolvedCheck | null): string | null {
  return check === null ? null : `${check.stat} check ${check.succeeded ? "succeeded" : "failed"}`;
}

export async function streamMessages(
  input: StartTurnInput,
  turnId: string,
  messages: Parameters<typeof streamChat>[0],
  signal: AbortSignal,
): Promise<string> {
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

export async function streamNarrative(
  input: StartTurnInput,
  turnId: string,
  check: ResolvedCheck | null,
  signal: AbortSignal,
  interactingCharacters: readonly Character[] = [],
  castSummary: string | null = null,
): Promise<string> {
  const settings = await loadSettings();
  const request = toNarrativeRequest(
    input,
    checkOutcomeOf(check),
    interactingCharacters,
    castSummary,
  );
  return streamMessages(input, turnId, buildNarrativePrompt(request, settings.prompt), signal);
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
