import {
  CHECK_RULES,
  CHOICE_BANNED_OPENERS,
  CHOICE_RULES,
  NARRATOR_ENHANCED,
  NARRATOR_RULES,
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
  interactingCharacters: readonly Character[] = [],
  castSummary: string | null = null,
): string {
  const parts = [
    `Setting: ${world.title}. ${world.description}`,
    `Genre: ${world.genre}`,
    `Protagonist: ${character.name} (${pronounPhrase(character.pronouns)}). ${character.bio}`,
    `Abilities: ${describeStats(world, character)}`,
    describeState(state, recentFacts),
  ];
  if (castSummary !== null && castSummary !== undefined && castSummary.length > 0) {
    parts.push(castSummary);
  }
  for (const other of interactingCharacters) {
    parts.push(
      `Interacting Character: ${other.name} (${pronounPhrase(other.pronouns)}). ${other.bio}`,
    );
  }
  return parts.join("\n\n");
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
  interactingCharacters?: readonly Character[];
  castSummary?: string | null;
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

  const context = buildContext(
    request.world,
    request.character,
    request.state,
    prompt.recentFacts,
    request.interactingCharacters ?? [],
    request.castSummary,
  );

  const history = buildHistory(request.ancestry, prompt.historyDepth);
  const check = request.checkOutcome === null ? "" : `Check outcome: ${request.checkOutcome}.\n\n`;

  const mentionGuidance =
    request.interactingCharacters && request.interactingCharacters.length > 0
      ? ` The player is interacting with ${request.interactingCharacters.map((c) => c.name).join(", ")}. Involve them directly.`
      : "";

  return [
    { role: "system", content: `${system}\n\n${context}` },
    ...history,
    {
      role: "user",
      content: `${check}Player action: ${request.action}.${mentionGuidance}`,
    },
  ];
}

export function buildChoicePrompt(
  narrativeText: string,
  interactingCharacters: readonly Character[] = [],
  action?: string,
  avoid: readonly string[] = [],
): ChatMessage[] {
  const banned = ` These openings are banned outright, never write a label starting with any of them: ${CHOICE_BANNED_OPENERS.join(", ")}.`;

  const rejected =
    avoid.length === 0
      ? ""
      : ` Already offered for this moment. Do not repeat, rephrase or reuse their verbs: ${avoid.join(" | ")}.`;
  const mentionHint =
    interactingCharacters.length > 0
      ? ` Note: Interacting cast: ${interactingCharacters.map((c) => c.name).join(", ")}. In sceneVisual, describe a candid, natural interaction (waist-up) where characters actively look at each other or react to the scene, NEVER staring into camera. Name each character's facial expression and body language explicitly, and make them match the emotion of this moment. Describe only action, pose, expression, setting and light. Never describe a character's gender, age, hair, body, build or clothing — those are recorded separately and a conflicting description swaps their bodies.`
      : "";

  const userContent =
    action !== undefined && action.trim().length > 0
      ? `Player action: "${action}"\n\nNarrative outcome: ${narrativeText}`
      : narrativeText;

  return [
    { role: "system", content: `${CHOICE_RULES.join(" ")}${banned}${mentionHint}${rejected}` },
    { role: "user", content: userContent },
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
