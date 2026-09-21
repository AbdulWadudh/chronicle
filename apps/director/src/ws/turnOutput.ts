import { loadSettings, schema, toTurnNode } from "@chronicle/db";
import { splitIntoSentences, type TurnNode } from "@chronicle/utils";
import { takeEarlyAudio } from "~/assets";
import type { ResolvedCheck } from "~/engine/adjudicator";
import type { TurnPlan } from "~/engine/choices";
import { memoryQueue, ttsQueue } from "~/queue";
import type { TurnContext } from "~/ws/context";
import type { StartTurnInput } from "~/ws/turnSession";

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

export async function commitTurn(
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
