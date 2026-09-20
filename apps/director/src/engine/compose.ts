import type {
  ComposeContext,
  ComposeMode,
  ComposeRequest,
  ComposeTarget,
  World,
} from "@chronicle/utils";
import { COMPOSE_FIELD, pronounPhrase } from "@chronicle/utils";
import { type ChatMessage, completeStructured } from "~/engine/llm";

const COMPOSE_TEMPERATURE = 0.95;
const BREAK = "\n\n";
const LINE = "\n";

const VALUE_SCHEMA = {
  type: "object",
  properties: { value: { type: "string" } },
  required: ["value"],
  additionalProperties: false,
} as const;

interface TargetSpec {
  noun: string;
  instruction: string;
  maxTokens: number;
}

const TARGETS: Record<ComposeTarget, TargetSpec> = {
  "world.premise": {
    noun: "premise",
    instruction:
      "One or two sentences naming a place, what is wrong with it, and the pressure the protagonist is under. Concrete and strange, never a genre label.",
    maxTokens: 160,
  },
  "world.title": {
    noun: "title",
    instruction: "Two to four words. Evocative, not descriptive. No subtitle and no article.",
    maxTokens: 60,
  },
  "world.genre": {
    noun: "genre",
    instruction: "One or two words naming the genre, in title case.",
    maxTokens: 40,
  },
  "world.description": {
    noun: "description",
    instruction:
      "Two or three sentences on what kind of place this is and what is wrong with it. Second person for the protagonist's role.",
    maxTokens: 400,
  },
  "world.opening": {
    noun: "opening situation",
    instruction:
      "Two or three sentences in second person, present tense, placing the protagonist in their first moment. End on a pressure, not a question.",
    maxTokens: 400,
  },
  "world.ability": {
    noun: "ability description",
    instruction:
      "One sentence saying when this ability is tested. Specific to this setting, never a generic attribute gloss.",
    maxTokens: 120,
  },
  "character.name": {
    noun: "character name",
    instruction: "A given name and a surname that suit the setting. Nothing else.",
    maxTokens: 40,
  },
  "character.portrait": {
    noun: "portrait prompt",
    instruction:
      "A comma-separated image prompt describing only what is visible: face, age, build, hair, clothing, bearing and setting. No sentences, no story, no camera or lighting directions.",
    maxTokens: 200,
  },
  "turn.scene": {
    noun: "scene prompt",
    instruction:
      "A comma-separated image prompt describing only what is visible in this moment: the place, the light, the weather, what is happening in frame. No sentences, no names, no dialogue.",
    maxTokens: 200,
  },
  "turn.whisper": {
    noun: "director's whisper",
    instruction:
      "One sentence of hidden stage direction for the game master: a pressure, an arrival, a turn of the weather, a cost coming due. Never address the player and never narrate the outcome.",
    maxTokens: 120,
  },
  "turn.action": {
    noun: "action",
    instruction:
      "One sentence in first person describing what the protagonist does next. Concrete and physical. Never decide whether it works, and never write the world's reply.",
    maxTokens: 140,
  },
  "character.bio": {
    noun: "backstory",
    instruction:
      "Three or four sentences, third person. How they came to be here and what they want. Their strongest abilities show in what they have done, never named as statistics.",
    maxTokens: 500,
  },
};

function worldLines(
  context: ComposeContext,
  world: World | null,
  omit: keyof ComposeContext,
): string[] {
  if (world !== null) {
    return [
      `Setting: ${world.title}. ${world.description}`,
      `Genre: ${world.genre}`,
      `Abilities: ${world.statDefinitions.map((definition) => definition.label).join(", ")}`,
    ];
  }
  const entries: [keyof ComposeContext, string][] = [
    ["premise", `Premise: ${context.premise}`],
    ["title", `Title: ${context.title}`],
    ["genre", `Genre: ${context.genre}`],
    ["description", `Description: ${context.description}`],
    ["opening", `Opening: ${context.opening}`],
  ];
  return [
    ...entries
      .filter(([key]) => key !== omit)
      .filter(([key]) => String(context[key]).length > 0)
      .map(([, line]) => line),
    context.abilities.length > 0 ? `Abilities: ${context.abilities.join(", ")}` : "",
  ];
}

const SITUATION_LABEL: Partial<Record<ComposeTarget, string>> = {
  "turn.scene": "The moment to illustrate",
  "turn.whisper": "Where the story stands",
};

function targetLines(
  target: ComposeTarget,
  context: ComposeContext,
  omit: keyof ComposeContext,
): string[] {
  if (target === "world.ability") return [`Ability being described: ${context.abilityLabel}`];
  if (target === "turn.action" || target === "turn.scene" || target === "turn.whisper") {
    return [
      target === "turn.action" && context.name.length > 0 ? `You are ${context.name}.` : "",
      target === "turn.action" && context.strengths.length > 0
        ? `Your strongest abilities: ${context.strengths}`
        : "",
      context.situation.length > 0
        ? `${SITUATION_LABEL[target] ?? "What just happened"}:
${context.situation}`
        : "",
      context.avoid.length > 0
        ? [
            "Already taken this story. Do not repeat, echo or rephrase any of them:",
            ...context.avoid.map((line) => `- ${line}`),
          ].join(LINE)
        : "",
    ];
  }
  if (!target.startsWith("character")) return [];
  return [
    omit !== "name" && context.name.length > 0 ? `Protagonist name: ${context.name}` : "",
    `Protagonist pronouns: ${pronounPhrase(context.pronouns)}. Use them throughout.`,
    context.strengths.length > 0 ? `Strongest abilities: ${context.strengths}` : "",
  ];
}

function directive(mode: ComposeMode, noun: string): string {
  return mode === "enhance"
    ? `Rewrite the existing ${noun} below. Keep its meaning and every proper noun, sharpen the language, and do not lengthen it by more than half.`
    : `Write a new ${noun} that fits the material below.`;
}

function buildMessages(
  request: ComposeRequest,
  spec: TargetSpec,
  world: World | null,
): ChatMessage[] {
  const omit = COMPOSE_FIELD[request.target];
  const existing = request.context[omit];
  const material = [
    ...worldLines(request.context, world, omit),
    ...targetLines(request.target, request.context, omit),
  ]
    .filter((line) => line.length > 0)
    .join(BREAK);

  const opening = material.length > 0 ? material : `Invent a ${spec.noun} from nothing.`;
  const rejected =
    existing.length > 0
      ? `Already rejected. Avoid it, and avoid reusing any part of it: ${existing}`
      : "";

  const prompt =
    request.mode === "enhance"
      ? [material, `Existing ${spec.noun}:`, existing].filter((part) => part.length > 0).join(BREAK)
      : [opening, rejected].filter((part) => part.length > 0).join(BREAK);

  return [
    {
      role: "system",
      content: [
        `You write one field of an interactive story: the ${spec.noun}.`,
        spec.instruction,
        directive(request.mode, spec.noun),
        "Return only that field's text. No preamble, no quotation marks, no markdown.",
      ].join(" "),
    },
    { role: "user", content: prompt },
  ];
}

export async function composeField(
  request: ComposeRequest,
  world: World | null,
  signal?: AbortSignal,
): Promise<string> {
  const spec = TARGETS[request.target];
  const drafted = await completeStructured<{ value: string }>(buildMessages(request, spec, world), {
    schemaName: "field_value",
    schema: VALUE_SCHEMA,
    maxTokens: spec.maxTokens,
    temperature: COMPOSE_TEMPERATURE,
    signal,
  });
  return drafted.value.trim().replace(/^["']|["']$/gu, "");
}
