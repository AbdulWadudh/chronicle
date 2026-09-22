import { loadSettings, schema, toTurnNode } from "@chronicle/db";
import {
  type AttributedSentence,
  type StatePatch,
  splitIntoSentences,
  type TurnCast,
  type TurnNode,
} from "@chronicle/utils";
import { takeEarlyAudio } from "~/assets";
import type { ResolvedCheck } from "~/engine/adjudicator";
import type { TurnPlan } from "~/engine/choices";
import { memoryQueue, ttsQueue } from "~/queue";
import type { TurnContext } from "~/ws/context";
import type { StartTurnInput } from "~/ws/turnSession";

export type VoiceIndex = ReadonlyMap<string, string>;

export function narratedSentences(narrative: string): AttributedSentence[] {
  return splitIntoSentences(narrative).map((text) => ({ text, speakerId: null }));
}

export async function enqueueSentenceAudio(
  context: TurnContext,
  turnId: string,
  sentences: readonly AttributedSentence[],
  voices: VoiceIndex = new Map(),
): Promise<void> {
  const settings = await loadSettings();
  const narrator = context.world.narratorVoiceId ?? settings.tts.voice;

  await Promise.all(
    sentences.map((sentence, sentenceIndex) =>
      ttsQueue.add("sentence", {
        turnId,
        worldId: context.world.id,
        characterId: context.character.id,
        sentenceIndex,
        text: sentence.text,
        speakerId: sentence.speakerId,
        voice:
          sentence.speakerId === null ? narrator : (voices.get(sentence.speakerId) ?? narrator),
        speed: settings.tts.speed,
      }),
    ),
  );
}

export async function dispatchAudio(
  context: TurnContext,
  turnId: string,
  narrative: string,
  sentences?: readonly AttributedSentence[],
  voices?: VoiceIndex,
): Promise<void> {
  await enqueueSentenceAudio(context, turnId, sentences ?? narratedSentences(narrative), voices);
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
  cast: TurnCast | null = null,
  stateDiff: StatePatch | null = null,
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
    stateDiffJson: stateDiff,
    diceCheckJson: check,
    castJson: cast,
    branchIndex: context.branchIndex,
    createdAt,
  };
  await context.db.insert(schema.turns).values(row);
  return toTurnNode(row);
}
