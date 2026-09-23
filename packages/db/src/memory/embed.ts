import { MEMORY } from "@chronicle/config";
import { env } from "@chronicle/config/env";
import { z } from "zod";

const embeddingResponseSchema = z.object({
  data: z.array(z.object({ index: z.number().int(), embedding: z.array(z.number()) })),
});

export type EmbedKind = keyof typeof MEMORY.prefix;

export async function embedTexts(texts: readonly string[], kind: EmbedKind): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await fetch(`${env().EMBED_ENDPOINT}/embeddings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: texts.map((text) => `${MEMORY.prefix[kind]}${text}`) }),
  });
  if (!response.ok) {
    throw new Error(`Embedding request failed with ${response.status}: ${await response.text()}`);
  }
  const parsed = embeddingResponseSchema.parse(await response.json());
  const vectors = [...parsed.data].sort((a, b) => a.index - b.index).map((row) => row.embedding);
  for (const vector of vectors) {
    if (vector.length !== MEMORY.dimensions) {
      throw new Error(
        `Embedding server returned ${vector.length} dimensions, expected ${MEMORY.dimensions}`,
      );
    }
  }
  return vectors;
}
