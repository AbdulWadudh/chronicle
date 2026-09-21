import type { ImageShape, TurnChoice } from "@chronicle/utils";
import { completeStructured } from "~/engine/llm";
import { buildChoicePrompt } from "~/engine/prompt";

const CHOICE_COUNT = 3;
const PLAN_TOKENS = 360;

export interface TurnPlan {
  choices: TurnChoice[];
  sceneShape: ImageShape;
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
  },
  required: ["choices", "sceneShape"],
  additionalProperties: false,
} as const;

export async function planTurn(narrative: string, signal: AbortSignal): Promise<TurnPlan> {
  try {
    const drafted = await completeStructured<TurnPlan>(buildChoicePrompt(narrative), {
      schemaName: "turn_plan",
      schema: PLAN_SCHEMA,
      maxTokens: PLAN_TOKENS,
      signal,
    });
    return {
      choices: drafted.choices
        .filter((choice) => choice.label.trim().length > 0)
        .slice(0, CHOICE_COUNT),
      sceneShape: drafted.sceneShape,
    };
  } catch (error) {
    if (signal.aborted) throw error;
    console.error("[director] could not plan the turn:", error);
    return { choices: [], sceneShape: "square" };
  }
}
