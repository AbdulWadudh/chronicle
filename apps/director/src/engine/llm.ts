import { env } from "@chronicle/config";
import { loadSettings } from "@chronicle/db";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamOptions {
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
}

export interface StructuredOptions extends StreamOptions {
  schemaName: string;
  schema: unknown;
}

interface ChatChunk {
  choices?: { delta?: { content?: string }; message?: { content?: string } }[];
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

export async function* streamChat(
  messages: readonly ChatMessage[],
  options: StreamOptions = {},
): AsyncGenerator<string> {
  const settings = await loadSettings();
  const response = await post(
    {
      model: env().LLM_MODEL,
      messages,
      stream: true,
      temperature: options.temperature ?? settings.narrative.temperature,
      max_tokens: options.maxTokens ?? settings.narrative.maxTokens,
    },
    options.signal,
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
      const token = readToken(payload);
      if (token !== null) yield token;
    }
  }
}

function readToken(payload: string): string | null {
  try {
    const chunk = JSON.parse(payload) as ChatChunk;
    return chunk.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
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
      response_format: {
        type: "json_schema",
        json_schema: { name: options.schemaName, strict: true, schema: options.schema },
      },
    },
    options.signal,
  );
  const parsed = (await response.json()) as ChatChunk;
  const content = parsed.choices?.[0]?.message?.content;
  if (content === undefined) throw new Error("LLM structured response carried no content");
  return JSON.parse(content) as T;
}
