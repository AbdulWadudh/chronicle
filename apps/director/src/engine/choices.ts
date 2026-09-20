import type { TurnChoice } from "@chronicle/utils";
import { completeStructured } from "~/engine/llm";
import { buildChoicePrompt } from "~/engine/prompt";

const CHOICE_COUNT = 3;
const CHOICE_TOKENS = 320;

const CHOICES_SCHEMA = {
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
  },
  required: ["choices"],
  additionalProperties: false,
} as const;

export async function proposeChoices(
  narrative: string,
  signal: AbortSignal,
): Promise<TurnChoice[]> {
  try {
    const drafted = await completeStructured<{ choices: TurnChoice[] }>(
      buildChoicePrompt(narrative),
      {
        schemaName: "turn_choices",
        schema: CHOICES_SCHEMA,
        maxTokens: CHOICE_TOKENS,
        signal,
      },
    );
    return drafted.choices
      .filter((choice) => choice.label.trim().length > 0)
      .slice(0, CHOICE_COUNT);
  } catch (error) {
    if (signal.aborted) throw error;
    console.error("[director] could not draft choices:", error);
    return [];
  }
}
