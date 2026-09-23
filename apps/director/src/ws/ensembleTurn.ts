import { loadSettings } from "@chronicle/db";
import { parseAttributedLines, type TurnNode } from "@chronicle/utils";
import type { ResolvedCheck } from "~/engine/adjudicator";
import { planEnsembleTurn } from "~/engine/choices";
import {
  chooseCast,
  resolveBondDeltas,
  resolvePresentAfter,
  voiceIndex,
  worldCast,
} from "~/engine/ensemble";
import { buildEnsemblePrompt } from "~/engine/prompt";
import {
  checkOutcomeOf,
  dispatchScene,
  FIRST_VARIANT,
  type StartTurnInput,
  streamMessages,
} from "~/ws/narration";
import { commitTurn, dispatchAudio, enqueueMemory } from "~/ws/turnOutput";

export async function playEnsembleTurn(
  input: StartTurnInput,
  turnId: string,
  check: ResolvedCheck | null,
  signal: AbortSignal,
): Promise<TurnNode | null> {
  const { context } = input;
  const settings = await loadSettings();

  const cast = await worldCast(context.db, context.world.id, context.character.id);
  if (cast.length === 0) return null;

  const { present, speakers, absent } = chooseCast({
    cast,
    parent: context.ancestry.at(-1),
    ancestry: context.ancestry,
    action: input.action,
    mentionedIds: input.mentionedCharacterIds ?? [],
    state: context.state,
    settings: settings.ensemble,
  });
  if (speakers.length === 0 && absent.length === 0) return null;

  const messages = buildEnsemblePrompt(
    {
      world: context.world,
      character: context.character,
      state: context.state,
      ancestry: context.ancestry,
      action: input.action,
      mode: input.mode,
      checkOutcome: checkOutcomeOf(check),
      directorWhisper: input.directorWhisper,
      recalled: input.recalled ?? [],
      speakers,
      present,
      absent,
    },
    settings.prompt,
    settings.ensemble,
  );

  const narrative = await streamMessages(input, turnId, messages, signal);
  const everyone = [context.character, ...present];
  const sentences = parseAttributedLines(narrative, everyone);

  await dispatchAudio(context, turnId, narrative, sentences, voiceIndex(present));
  await enqueueMemory(context, turnId, input.action, narrative);

  const plan = await planEnsembleTurn(narrative, signal, speakers, input.action, everyone);
  const spoke = new Set(
    sentences.flatMap((line) => (line.speakerId === null ? [] : [line.speakerId])),
  );
  const inShot = speakers.filter((actor) => spoke.has(actor.id));

  await dispatchScene(
    input.socket,
    input.replyTo,
    context,
    turnId,
    narrative,
    plan.sceneShape,
    FIRST_VARIANT,
    inShot.length > 0 ? inShot : speakers,
    plan.sceneVisual,
  );

  const after = resolvePresentAfter(plan.presentAfter, cast);
  const bondDeltas = resolveBondDeltas(plan.bondDeltas, everyone);

  return commitTurn(
    input,
    turnId,
    narrative,
    check,
    plan,
    { present: after.length > 0 ? after : present.map((actor) => actor.id) },
    Object.keys(bondDeltas).length === 0 ? null : { bondDeltas },
  );
}
