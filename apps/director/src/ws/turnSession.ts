import { loadSettings, newId, schema, toTurnNode } from "@chronicle/db";
import {
  type ImageShape,
  PROTOCOL_VERSION,
  splitIntoSentences,
  type TurnNode,
} from "@chronicle/utils";
import { takeEarlyAudio } from "~/assets";
import {
  CHECK_PROPOSAL_SCHEMA,
  type CheckProposal,
  type ResolvedCheck,
  resolveCheck,
} from "~/engine/adjudicator";
import { planTurn, type TurnPlan } from "~/engine/choices";
import { enqueueScene } from "~/engine/imagery";
import { completeStructured, streamChat } from "~/engine/llm";
import { buildCheckPrompt, buildNarrativePrompt } from "~/engine/prompt";
import { memoryQueue, ttsQueue } from "~/queue";
import { closeBuffer, openBuffer } from "~/ws/buffer";
import type { TurnContext } from "~/ws/context";
import { ownTurn } from "~/ws/media";
import { beginTurn, type ChronicleSocket, finishTurn, send } from "~/ws/session";

const FIRST_VARIANT = 1;

interface CheckDecision {
  requiresCheck: boolean;
  stat?: string;
  dc?: number;
  reason?: string;
}

export interface StartTurnInput {
  socket: ChronicleSocket;
  replyTo: string;
  context: TurnContext;
  parentTurnId: string | null;
  action: string;
  mode: "scratch" | "enhanced";
  directorWhisper: string | null;
}

export async function runTurn(input: StartTurnInput): Promise<void> {
  const { socket, replyTo, context } = input;
  const turnId = newId();
  const signal = beginTurn(turnId);
  openBuffer(turnId);
  ownTurn(turnId, socket);

  send(socket, {
    v: PROTOCOL_VERSION,
    replyTo,
    type: "TURN_INITIALIZED",
    turnId,
    parentId: input.parentTurnId,
  });

  try {
    const check = await adjudicate(input, turnId, signal);
    const narrative = await streamNarrative(input, turnId, check, signal);
    await dispatchAudio(context, turnId, narrative);
    const plan = await planTurn(narrative, signal);
    await dispatchScene(socket, replyTo, context, turnId, narrative, plan.sceneShape);
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
        message: error instanceof Error ? error.message : "Turn failed.",
      });
    }
  } finally {
    finishTurn(turnId);
    closeBuffer(turnId);
  }
}

async function adjudicate(
  input: StartTurnInput,
  turnId: string,
  signal: AbortSignal,
): Promise<ResolvedCheck | null> {
  const request = toNarrativeRequest(input, null);
  const settings = await loadSettings();
  const decision = await completeStructured<CheckDecision>(buildCheckPrompt(request), {
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
): Promise<string> {
  const outcome =
    check === null ? null : `${check.stat} check ${check.succeeded ? "succeeded" : "failed"}`;
  const settings = await loadSettings();
  const messages = buildNarrativePrompt(toNarrativeRequest(input, outcome), settings.prompt);

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

export async function enqueueSentenceAudio(
  context: TurnContext,
  turnId: string,
  narrative: string,
): Promise<void> {
  const settings = await loadSettings();
  await Promise.all(
    splitIntoSentences(narrative).map((text, sentenceIndex) =>
      ttsQueue.add("sentence", {
        turnId,
        worldId: context.world.id,
        characterId: context.character.id,
        sentenceIndex,
        text,
        voice: settings.tts.voice,
        speed: settings.tts.speed,
      }),
    ),
  );
}

export async function dispatchScene(
  socket: ChronicleSocket,
  replyTo: string,
  context: TurnContext,
  turnId: string,
  narrative: string,
  shape: ImageShape,
  variant: number = FIRST_VARIANT,
): Promise<void> {
  await enqueueScene(context.world, context.character, turnId, narrative, shape, variant);
  send(socket, { v: PROTOCOL_VERSION, replyTo, type: "SCENE_PLANNED", turnId, shape });
}

export async function dispatchAudio(
  context: TurnContext,
  turnId: string,
  narrative: string,
): Promise<void> {
  await enqueueSentenceAudio(context, turnId, narrative);
  await memoryQueue.add("episode", {
    turnId,
    characterId: context.character.id,
    worldId: context.world.id,
    narrativeText: narrative,
  });
}

async function commitTurn(
  input: StartTurnInput,
  turnId: string,
  narrative: string,
  check: ResolvedCheck | null,
  plan: TurnPlan,
): Promise<TurnNode> {
  const { context } = input;
  const createdAt = new Date();
  const row = {
    id: turnId,
    parentId: input.parentTurnId,
    characterId: context.character.id,
    playerAction: input.action,
    narrativeText: narrative,
    choicesJson: plan.choices,
    sceneImageUrl: null,
    sceneShape: plan.sceneShape,
    audioUrlsJson: takeEarlyAudio(turnId),
    stateDiffJson: null,
    diceCheckJson: check,
    branchIndex: context.branchIndex,
    createdAt,
  };
  await context.db.insert(schema.turns).values(row);
  return toTurnNode(row);
}

export function toNarrativeRequest(input: StartTurnInput, checkOutcome: string | null) {
  return {
    world: input.context.world,
    character: input.context.character,
    state: input.context.state,
    ancestry: input.context.ancestry,
    action: input.action,
    mode: input.mode,
    checkOutcome,
    directorWhisper: input.directorWhisper,
  };
}
