import type { Character, TurnNode, World, WorldState } from "@chronicle/shared";
import type { ChatMessage } from "./llm";

const NARRATOR_SYSTEM = [
  "You are the narrator of an interactive story.",
  "Write in second person, present tense.",
  "Produce three to five sentences of vivid prose, then stop.",
  "Never write the player's dialogue or decide their intent.",
  "Never mention dice, statistics, or game mechanics.",
].join(" ");

const CHOICE_SCHEMA_HINT = "Return exactly three distinct, concrete next actions.";

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
    `Protagonist: ${character.name}. ${character.bio}`,
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
  prompt: { historyDepth: number; recentFacts: number },
): ChatMessage[] {
  const system = [
    NARRATOR_SYSTEM,
    request.mode === "enhanced" ? "Elevate the player's phrasing into richer prose." : "",
    request.directorWhisper === null ? "" : `Hidden direction: ${request.directorWhisper}`,
  ]
    .filter((part) => part.length > 0)
    .join(" ");

  const action =
    request.checkOutcome === null
      ? request.action
      : `${request.action}\n(Outcome: ${request.checkOutcome})`;

  return [
    { role: "system", content: system },
    {
      role: "system",
      content: buildContext(request.world, request.character, request.state, prompt.recentFacts),
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
        "Decide whether the player's action needs an ability check.",
        `Available stat ids: ${statIds}.`,
        "Only require a check when failure would be interesting.",
        "Difficulty ranges from 5 (trivial) to 30 (near impossible).",
      ].join(" "),
    },
    { role: "user", content: request.action },
  ];
}

export function buildChoicePrompt(narrative: string): ChatMessage[] {
  return [
    { role: "system", content: CHOICE_SCHEMA_HINT },
    { role: "user", content: narrative },
  ];
}

export function buildScenePrompt(world: World, narrative: string, maxChars: number): string {
  return `${world.genre} cinematic illustration, ${narrative.slice(0, maxChars)}, dramatic lighting, highly detailed`;
}
