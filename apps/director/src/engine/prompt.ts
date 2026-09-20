import {
  CHECK_RULES,
  CHOICE_RULES,
  IMAGERY,
  NARRATOR_ENHANCED,
  NARRATOR_RULES,
  SUBJECT_BY_PRONOUN,
} from "@chronicle/config";
import {
  type Character,
  pronounPhrase,
  type TurnNode,
  type World,
  type WorldState,
} from "@chronicle/utils";
import type { ChatMessage } from "~/engine/llm";

function narratorSystem(sentences: number): string {
  const [voice, tense, ...rest] = NARRATOR_RULES;
  const length = `Write at most ${sentences} ${sentences === 1 ? "sentence" : "sentences"}, then stop.`;
  return [voice, tense, length, ...rest].join(" ");
}

export function describeStats(world: World, character: Character): string {
  return world.statDefinitions
    .map((definition) => `${definition.label}: ${character.stats[definition.id] ?? 1}/5`)
    .join(", ");
}

export function describeState(state: WorldState, recentFacts: number): string {
  const facts = state.facts.slice(-recentFacts);
  const affinities = Object.entries(state.affinities)
    .map(([name, value]) => `${name} ${value >= 0 ? "+" : ""}${value}`)
    .join(", ");
  return [
    state.summary,
    facts.length > 0 ? `Established: ${facts.join("; ")}` : "",
    affinities.length > 0 ? `Relationships: ${affinities}` : "",
  ]
    .filter((part) => part.length > 0)
    .join("\n");
}

export function buildContext(
  world: World,
  character: Character,
  state: WorldState,
  recentFacts: number,
): string {
  return [
    `Setting: ${world.title}. ${world.description}`,
    `Genre: ${world.genre}`,
    `Protagonist: ${character.name} (${pronounPhrase(character.pronouns)}). ${character.bio}`,
    `Abilities: ${describeStats(world, character)}`,
    describeState(state, recentFacts),
  ]
    .filter((part) => part.trim().length > 0)
    .join("\n");
}

export function buildHistory(ancestry: readonly TurnNode[], depth: number): ChatMessage[] {
  return ancestry.slice(-depth).flatMap((turn): ChatMessage[] => [
    { role: "user", content: turn.playerAction },
    { role: "assistant", content: turn.narrativeText },
  ]);
}

export interface NarrativeRequest {
  world: World;
  character: Character;
  state: WorldState;
  ancestry: readonly TurnNode[];
  action: string;
  mode: "scratch" | "enhanced";
  checkOutcome: string | null;
  directorWhisper: string | null;
}

export function buildNarrativePrompt(
  request: NarrativeRequest,
  prompt: { historyDepth: number; recentFacts: number; sentences: number },
): ChatMessage[] {
  const system = [
    narratorSystem(prompt.sentences),
    request.mode === "enhanced" ? NARRATOR_ENHANCED : "",
    request.directorWhisper === null ? "" : `Hidden direction: ${request.directorWhisper}`,
  ]
    .filter((part) => part.length > 0)
    .join(" ");

  const action =
    request.checkOutcome === null
      ? request.action
      : `${request.action}\n(Outcome: ${request.checkOutcome})`;

  const context = buildContext(request.world, request.character, request.state, prompt.recentFacts);

  return [
    {
      role: "system",
      content: `${system}

${context}`,
    },
    ...buildHistory(request.ancestry, prompt.historyDepth),
    { role: "user", content: action },
  ];
}

export function buildCheckPrompt(request: NarrativeRequest): ChatMessage[] {
  const statIds = request.world.statDefinitions.map((definition) => definition.id).join(", ");
  return [
    {
      role: "system",
      content: [
        CHECK_RULES[0],
        `Available stat ids: ${statIds}.`,
        CHECK_RULES[1],
        CHECK_RULES[2],
      ].join(" "),
    },
    { role: "user", content: request.action },
  ];
}

export function buildChoicePrompt(narrative: string): ChatMessage[] {
  return [
    { role: "system", content: CHOICE_RULES.join(" ") },
    { role: "user", content: narrative },
  ];
}

export function buildScenePrompt(
  world: World,
  character: Character,
  narrative: string,
  maxChars: number,
): string {
  const { lead, framing, style } = IMAGERY.scene;
  const who = SUBJECT_BY_PRONOUN[character.pronouns];
  return `${lead}, ${world.genre}, ${who} mid-action: ${clip(narrative, maxChars)}, ${framing}, ${style}`;
}

export function buildCoverPrompt(world: World, maxChars: number): string {
  const { lead, style } = IMAGERY.cover;
  return `${world.genre} ${lead}, ${world.title}, ${clip(world.description, maxChars)}, ${style}`;
}

function clip(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const window = text.slice(0, maxChars);
  const sentence = Math.max(
    window.lastIndexOf("."),
    window.lastIndexOf("!"),
    window.lastIndexOf("?"),
  );
  if (sentence > maxChars / 2) return window.slice(0, sentence + 1);
  const word = window.lastIndexOf(" ");
  return word > 0 ? window.slice(0, word) : window;
}

export function buildPortraitPrompt(world: World, character: Character, maxChars: number): string {
  const { lead, chest, waist, style, belowChest } = IMAGERY.portrait;
  const description = clip(character.bio, maxChars);
  const framing = belowChest.test(description) ? waist : chest;
  const who = SUBJECT_BY_PRONOUN[character.pronouns];
  return `${world.genre} ${lead}, ${character.name}, ${who}, ${description}, ${framing}, ${style}`;
}
