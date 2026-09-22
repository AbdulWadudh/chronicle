import type { Character, ImageShape, TurnChoice } from "@chronicle/utils";
import { completeStructured } from "~/engine/llm";
import { buildChoicePrompt } from "~/engine/prompt";

const CHOICE_COUNT = 3;
const PLAN_TOKENS = 512;

export interface TurnPlan {
  choices: TurnChoice[];
  sceneShape: ImageShape;
  sceneVisual: string;
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
    };
  } catch {
    return { choices: [], sceneShape: "square", sceneVisual: "" };
  }
}
