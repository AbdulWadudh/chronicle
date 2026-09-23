import { env } from "@chronicle/config/env";
import { loadSettings } from "@chronicle/db";
import { z } from "zod";

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export async function completeStructured<T>(
  messages: readonly ChatMessage[],
  schemaName: string,
  schema: unknown,
  parse: (raw: unknown) => T,
): Promise<T> {
  const settings = await loadSettings();
  const response = await fetch(`${env().LLM_ENDPOINT}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: env().LLM_MODEL,
      messages,
      stream: false,
      temperature: settings.structured.temperature,
      max_tokens: settings.structured.maxTokens,
      chat_template_kwargs: { enable_thinking: false },
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`LLM request failed with ${response.status}: ${await response.text()}`);
  }
  const content = completionSchema.parse(await response.json()).choices[0]?.message.content ?? "";
  return parse(JSON.parse(content));
}
