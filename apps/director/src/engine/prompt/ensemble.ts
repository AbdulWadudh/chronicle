import { ENSEMBLE, type EnsembleSettings } from "@chronicle/config";
import { type Character, describeBonds, pronounPhrase, type WorldState } from "@chronicle/utils";
import type { ChatMessage } from "~/engine/llm";
import {
  buildHistory,
  describePersona,
  describeRecall,
  describeState,
  describeStats,
  type NarrativeRequest,
} from "~/engine/prompt/narrative";
import { clip } from "~/engine/prompt/scene";

const SPEAKER_BIO_CHARS = 220;
const SILENT_BIO_CHARS = 140;

export interface EnsembleRequest extends NarrativeRequest {
  speakers: readonly Character[];
  present: readonly Character[];
  absent: readonly Character[];
}

function speakerLine(character: Character): string {
  const persona = describePersona(character);
  return [
    `- ${character.name} (${pronounPhrase(character.pronouns)}). ${clip(character.bio, SPEAKER_BIO_CHARS)}`,
    persona,
  ]
    .filter((part) => part.length > 0)
    .join(" ");
}

function firstSentence(text: string, maxChars: number): string {
  for (const match of text.matchAll(/([A-Za-z']+)[.!?](\s|$)/gu)) {
    const word = match[1] ?? "";
    if (word.length <= 2) continue;
    const end = match.index + match[0].trimEnd().length;
    if (end <= maxChars) return text.slice(0, end);
    break;
  }
  return text.length <= maxChars ? text : `${clip(text, maxChars)}…`;
}

function silentLine(character: Character): string {
  return `- ${character.name}: ${firstSentence(character.bio, SILENT_BIO_CHARS)}`;
}

export function describeAbsent(absent: readonly Character[]): string {
  if (absent.length === 0) return "";
  const names = absent.map((actor) => actor.name).join(", ");
  return `${names}: ${ENSEMBLE.persona.absent}`;
}

export function describeCast(
  speakers: readonly Character[],
  present: readonly Character[],
): string {
  const speaking = new Set(speakers.map((actor) => actor.id));
  const silent = present.filter((actor) => !speaking.has(actor.id));

  const blocks = [`${ENSEMBLE.persona.lead}\n${speakers.map(speakerLine).join("\n")}`];
  if (silent.length > 0) {
    blocks.push(`Present but silent this turn:\n${silent.map(silentLine).join("\n")}`);
  }
  blocks.push(ENSEMBLE.persona.rule);
  return blocks.join("\n\n");
}

export function describeFeelings(state: WorldState, cast: readonly Character[]): string {
  const lines = describeBonds(state.bonds, cast);
  if (lines.length === 0) return "";
  const rendered = lines
    .map((line) => `- ${line.from} ${line.phrase} ${line.to} — ${line.delivery}.`)
    .join("\n");
  return `${ENSEMBLE.bonds.lead}\n${rendered}\n\n${ENSEMBLE.bonds.rule}`;
}

function instructions(request: EnsembleRequest, sentences: number): string {
  const length = `Write at most ${sentences} ${sentences === 1 ? "sentence" : "sentences"} of narration. Spoken lines are separate and are never counted against that.`;
  const { attribution } = ENSEMBLE;

  return [
    ...ENSEMBLE.narrator,
    length,
    request.world.narratorPrompt.trim(),
    request.mode === "enhanced" ? "Elevate the player's phrasing into richer prose." : "",
    attribution.speech,
    attribution.narration,
    attribution.discipline,
    ...ENSEMBLE.turnTaking,
    request.directorWhisper === null ? "" : `Hidden direction: ${request.directorWhisper}`,
  ]
    .filter((part) => part.length > 0)
    .join(" ");
}

function billing(speakers: readonly Character[], maxLines: number): string {
  if (speakers.length === 0) {
    return "Nobody here speaks this turn. Write narration only, and do not put a name in front of any line.";
  }
  const order = speakers.map((actor) => actor.name).join(", then ");
  return [
    "Open with the narration, then the spoken lines.",
    `Speaking this turn, in this order: ${order}.`,
    `Each of them speaks at most ${maxLines} ${maxLines === 1 ? "time" : "times"},`,
    "on their own line, starting with their exact name and a colon.",
    "Write their lines even if the turns before this one contained none.",
  ].join(" ");
}

export function buildEnsemblePrompt(
  request: EnsembleRequest,
  prompt: { historyDepth: number; recentFacts: number; sentences: number },
  ensemble: EnsembleSettings,
): ChatMessage[] {
  const { world, character, state } = request;
  const cast = [character, ...request.present];

  const context = [
    `Setting: ${world.title}. ${world.description}`,
    `Genre: ${world.genre}`,
    `Protagonist: ${character.name} (${pronounPhrase(character.pronouns)}). ${character.bio} ${describePersona(character)}`.trim(),
    `Abilities: ${describeStats(world, character)}`,
    describeState(state, prompt.recentFacts),
    describeRecall(request.recalled ?? []),
    describeCast(request.speakers, request.present),
    describeAbsent(request.absent),
    describeFeelings(state, cast),
  ]
    .filter((part) => part.length > 0)
    .join("\n\n");

  const check = request.checkOutcome === null ? "" : `Check outcome: ${request.checkOutcome}.\n\n`;

  return [
    {
      role: "system",
      content: `${instructions(request, prompt.sentences)}\n\n${context}`,
    },
    ...buildHistory(request.ancestry, prompt.historyDepth),
    {
      role: "user",
      content: `${check}Player action: ${request.action}.

${billing(request.speakers, ensemble.maxLinesPerSpeaker)}`,
    },
  ];
}

export function buildEnsembleChoicePrompt(
  narrativeText: string,
  speakers: readonly Character[],
  action?: string,
): ChatMessage[] {
  const named =
    speakers.length === 0
      ? ""
      : ` The characters who just spoke are ${speakers.map((actor) => actor.name).join(", ")}. In sceneVisual, describe a candid interaction where they look at each other or react to the moment, never into camera. Name each one's expression and body language. Never describe anyone's gender, age, hair, body, build or clothing — those are recorded separately and a conflicting description swaps their bodies.`;

  const userContent =
    action !== undefined && action.trim().length > 0
      ? `Player action: "${action}"\n\nWhat happened: ${narrativeText}`
      : narrativeText;

  return [
    { role: "system", content: `${ENSEMBLE.choice.join(" ")}${named}` },
    { role: "user", content: userContent },
  ];
}
