import { loadSettings, newId, schema } from "@chronicle/db";
import { PROTOCOL_VERSION, splitIntoSentences, type TurnNode } from "@chronicle/shared";
import {
  CHECK_PROPOSAL_SCHEMA,
  type CheckProposal,
  type ResolvedCheck,
  resolveCheck,
} from "~/engine/adjudicator";
import { completeStructured, streamChat } from "~/engine/llm";
import { buildCheckPrompt, buildNarrativePrompt, buildScenePrompt } from "~/engine/prompt";
import { diffusionQueue, memoryQueue, ttsQueue } from "~/queue";
import { closeBuffer, openBuffer } from "~/ws/buffer";
import type { TurnContext } from "~/ws/context";
import { beginTurn, type ChronicleSocket, finishTurn, send } from "~/ws/session";

const MAX_SEED = 2_147_483_647;

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
    await dispatchMedia(context, turnId, narrative);
    const turn = await commitTurn(input, turnId, narrative, check);
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

async function streamNarrative(
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
  for await (const token of streamChat(messages, { signal })) {
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

async function dispatchMedia(
  context: TurnContext,
  turnId: string,
  narrative: string,
): Promise<void> {
  const settings = await loadSettings();
  const sentences = splitIntoSentences(narrative);
  await diffusionQueue.add("scene", {
    turnId,
    prompt: buildScenePrompt(context.world, narrative, settings.prompt.sceneChars),
    negativePrompt: settings.image.negativePrompt,
    seed: Math.floor(Math.random() * MAX_SEED),
    width: settings.image.width,
    height: settings.image.height,
    steps: settings.image.steps,
  });
  await Promise.all(
    sentences.map((text, sentenceIndex) =>
      ttsQueue.add("sentence", {
        turnId,
        sentenceIndex,
        text,
        voice: settings.tts.voice,
        speed: settings.tts.speed,
      }),
    ),
  );
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
): Promise<TurnNode> {
  const { context } = input;
  const createdAt = new Date();
  const row = {
    id: turnId,
    parentId: input.parentTurnId,
    characterId: context.character.id,
    playerAction: input.action,
    narrativeText: narrative,
    choicesJson: [],
    sceneImageUrl: null,
    audioUrlsJson: [],
    stateDiffJson: null,
    diceCheckJson: check,
    branchIndex: context.branchIndex,
    createdAt,
  };
  await context.db.insert(schema.turns).values(row);
  return {
    id: turnId,
    parentId: input.parentTurnId,
    characterId: context.character.id,
    playerAction: input.action,
    narrativeText: narrative,
    choices: [],
    sceneImageUrl: null,
    audioUrls: [],
    stateDiff: null,
    diceCheck: check,
    branchIndex: context.branchIndex,
    createdAt,
  };
}

function toNarrativeRequest(input: StartTurnInput, checkOutcome: string | null) {
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
