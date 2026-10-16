import type { Character, ImageShape, TurnChoice } from "@chronicle/utils";
import { completeStructured } from "~/engine/llm";
import { buildChoicePrompt, buildEnsembleChoicePrompt } from "~/engine/prompt";

const CHOICE_COUNT = 3;
const PLAN_TOKENS = 512;
const ENSEMBLE_PLAN_TOKENS = 768;
const BOND_DELTA_LIMIT = 8;

const EMPTY_PLAN: TurnPlan = {
  choices: [],
  sceneShape: "square",
  sceneVisual: "",
  presentAfter: [],
  bondDeltas: [],
};

export interface BondDelta {
  from: string;
  to: string;
  delta: number;
}

export interface TurnPlan {
  choices: TurnChoice[];
  sceneShape: ImageShape;
  sceneVisual: string;
  presentAfter: string[];
  bondDeltas: BondDelta[];
}

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    choices: {
      type: "array",
      minItems: CHOICE_COUNT,
      maxItems: CHOICE_COUNT,
      items: {
        type: "object",
        properties: { label: { type: "string" }, hint: { type: "string" } },
        required: ["label", "hint"],
        additionalProperties: false,
      },
    },
    sceneShape: { type: "string", enum: ["square", "portrait", "landscape"] },
    sceneVisual: {
      type: "string",
      description:
        "A cinematic visual description capturing the action and emotional state. You MUST describe specific, dynamic facial expressions and poses for each character matching the dramatic tone (e.g. furrowed brow, mouth parted in shock, eyes wide with terror, clenched jaw, looking urgently at each other). Never describe blank, neutral, or camera-staring expressions. Use waist-up or close-up framing so expressions and physical interaction are prominent and sharp.",
    },
  },
  required: ["choices", "sceneShape", "sceneVisual"],
  additionalProperties: false,
} as const;

function ensemblePlanSchema(names: readonly string[]) {
  const who = { type: "string", enum: [...names] };
  return {
    type: "object",
    properties: {
      ...PLAN_SCHEMA.properties,
      presentAfter: {
        type: "array",
        items: who,
        description:
          "Every character still in the scene when this moment ends. Drop anyone who left, add anyone who arrived. The player is never listed.",
      },
      bondDeltas: {
        type: "array",
        items: {
          type: "object",
          properties: { from: who, to: who, delta: { type: "integer" } },
          required: ["from", "to", "delta"],
          additionalProperties: false,
        },
        description:
          "How this moment changed what one character feels about another, from -2 to 2. Being contradicted, corrected, defended, backed up, thanked, doubted or ignored all count. Return an empty array only when nobody interacted.",
      },
    },
    required: ["choices", "sceneShape", "sceneVisual", "presentAfter", "bondDeltas"],
    additionalProperties: false,
  };
}

export async function planTurn(
  narrative: string,
  signal: AbortSignal,
  interactingCharacters: readonly Character[] = [],
  action?: string,
  avoid: readonly string[] = [],
): Promise<TurnPlan> {
  try {
    const drafted = await completeStructured<TurnPlan>(
      buildChoicePrompt(narrative, interactingCharacters, action, avoid),
      {
        schemaName: "turn_plan",
        schema: PLAN_SCHEMA,
        maxTokens: PLAN_TOKENS,
        signal,
      },
    );
    return {
      choices: drafted.choices
        .filter((choice) => choice.label.trim().length > 0)
        .slice(0, CHOICE_COUNT),
      sceneShape: drafted.sceneShape,
      sceneVisual: drafted.sceneVisual ?? "",
      presentAfter: drafted.presentAfter ?? [],
      bondDeltas: drafted.bondDeltas ?? [],
    };
  } catch {
    return EMPTY_PLAN;
  }
}

export async function planEnsembleTurn(
  narrative: string,
  signal: AbortSignal,
  speakers: readonly Character[],
  action?: string,
  cast: readonly Character[] = speakers,
): Promise<TurnPlan> {
  try {
    const drafted = await completeStructured<TurnPlan>(
      buildEnsembleChoicePrompt(narrative, speakers, action),
      {
        schemaName: "ensemble_turn_plan",
        schema: ensemblePlanSchema(cast.map((actor) => actor.name)),
        maxTokens: ENSEMBLE_PLAN_TOKENS,
        signal,
      },
    );
    return {
      choices: drafted.choices
        .filter((choice) => choice.label.trim().length > 0)
        .slice(0, CHOICE_COUNT),
      sceneShape: drafted.sceneShape,
      sceneVisual: drafted.sceneVisual ?? "",
      presentAfter: drafted.presentAfter ?? [],
      bondDeltas: (drafted.bondDeltas ?? []).slice(0, BOND_DELTA_LIMIT),
    };
  } catch {
    return EMPTY_PLAN;
  }
}
