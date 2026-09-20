import { env } from "@chronicle/config/env";
import { loadSettings } from "@chronicle/db";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamOptions {
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
  thinking?: boolean;
}

export interface StructuredOptions extends StreamOptions {
  schemaName: string;
  schema: unknown;
}

interface ChatChunk {
  choices?: {
    delta?: { content?: string; reasoning_content?: string };
    message?: { content?: string };
  }[];
}

interface StreamPlan {
  thinking: boolean;
  maxTokens: number;
  temperature: number;
}

async function post(body: unknown, signal: AbortSignal | undefined): Promise<Response> {
  const response = await fetch(`${env().LLM_ENDPOINT}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: signal ?? null,
  });
  if (!response.ok) {
    throw new Error(`LLM request failed with ${response.status}: ${await response.text()}`);
  }
  return response;
}

function readContent(payload: string): string | null {
  try {
    const chunk = JSON.parse(payload) as ChatChunk;
    return chunk.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

async function* streamOnce(
  messages: readonly ChatMessage[],
  plan: StreamPlan,
  signal: AbortSignal | undefined,
): AsyncGenerator<string> {
  const response = await post(
    {
      model: env().LLM_MODEL,
      messages,
      stream: true,
      temperature: plan.temperature,
      max_tokens: plan.maxTokens,
      chat_template_kwargs: { enable_thinking: plan.thinking },
    },
    signal,
  );

  const body = response.body;
  if (body === null) throw new Error("LLM response carried no body");

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const bytes of body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(bytes, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      const token = readContent(payload);
      if (token !== null && token.length > 0) yield token;
    }
  }
}

export async function* streamChat(
  messages: readonly ChatMessage[],
  options: StreamOptions = {},
): AsyncGenerator<string> {
  const settings = await loadSettings();
  const temperature = options.temperature ?? settings.narrative.temperature;
  const maxTokens = options.maxTokens ?? settings.narrative.maxTokens;
  const thinking = (options.thinking ?? false) && settings.narrative.thinking;

  const plan: StreamPlan = {
    thinking,
    temperature,
    maxTokens: thinking ? maxTokens + settings.narrative.thinkingBudget : maxTokens,
  };

  let produced = 0;
  for await (const token of streamOnce(messages, plan, options.signal)) {
    produced += 1;
    yield token;
  }
  if (produced > 0 || !thinking) return;

  const fallback: StreamPlan = { thinking: false, temperature, maxTokens };
  for await (const token of streamOnce(messages, fallback, options.signal)) {
    yield token;
  }
}

export async function completeStructured<T>(
  messages: readonly ChatMessage[],
  options: StructuredOptions,
): Promise<T> {
  const settings = await loadSettings();
  const response = await post(
    {
      model: env().LLM_MODEL,
      messages,
      stream: false,
      temperature: options.temperature ?? settings.structured.temperature,
      max_tokens: options.maxTokens ?? settings.structured.maxTokens,
      chat_template_kwargs: { enable_thinking: false },
      response_format: {
        type: "json_schema",
        json_schema: { name: options.schemaName, strict: true, schema: options.schema },
      },
    },
    options.signal,
  );
  const parsed = (await response.json()) as ChatChunk;
  const content = parsed.choices?.[0]?.message?.content;
  if (content === undefined || content.length === 0) {
    throw new Error("LLM structured response carried no content");
  }
  return JSON.parse(content) as T;
}
