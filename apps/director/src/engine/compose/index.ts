import type {
  ComposeContext,
  ComposeMode,
  ComposeRequest,
  ComposeTarget,
  World,
} from "@chronicle/utils";
import { COMPOSE_FIELD, pronounPhrase } from "@chronicle/utils";
import { TARGETS, type TargetSpec } from "~/engine/compose/targets";
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
        ? `${SITUATION_LABEL[target] ?? "What just happened"}:\n${context.situation}`
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
    omit !== "bio" && context.bio.length > 0 ? `Backstory: ${context.bio}` : "",
    target === "character.outfit" && context.appearance.length > 0
      ? `Their appearance: ${context.appearance}`
      : "",
  ];
}

function directive(mode: ComposeMode, noun: string, hasMention: boolean): string {
  if (mode === "enhance") {
    const mentionRule = hasMention
      ? " Crucially, keep every character '@Name' mention notation intact (e.g. '@Elara Voss')."
      : "";
    return `Rewrite the existing ${noun} below. Keep its meaning and every proper noun, sharpen the language, and do not lengthen it by more than half.${mentionRule}`;
  }
  return `Write a new ${noun} that fits the material below.`;
}

function preserveMentions(original: string, rewritten: string): string {
  const mentions = Array.from(original.matchAll(/@([a-zA-Z0-9_ ]+)/gu)).map((match) =>
    (match[1] ?? "").trim(),
  );
  let result = rewritten;
  for (const name of mentions) {
    if (name.length === 0) continue;
    const bareRegex = new RegExp(
      `(?<!@)\\b${name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\b`,
      "gu",
    );
    result = result.replace(bareRegex, `@${name}`);
  }
  return result;
}

function buildMessages(
  request: ComposeRequest,
  spec: TargetSpec,
  world: World | null,
): ChatMessage[] {
  const omit = COMPOSE_FIELD[request.target];
  const existing = request.context[omit];
  const hasMention = existing.includes("@");
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
        directive(request.mode, spec.noun, hasMention),
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
  const cleaned = drafted.value.trim().replace(/^["']|["']$/gu, "");
  const omit = COMPOSE_FIELD[request.target];
  const existing = request.context[omit];
  return existing.includes("@") ? preserveMentions(existing, cleaned) : cleaned;
}
