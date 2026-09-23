import { MEMORY, MEMORY_CHANNEL } from "@chronicle/config";
import { embedTexts, rememberEpisode } from "@chronicle/db";
import { type MemoryJob, type MemoryReady, memoryJobSchema } from "@chronicle/utils";
import type { Job } from "bullmq";
import { z } from "zod";
import { completeStructured } from "~/llm";
import { publisher } from "~/redis";

const summarySchema = z.object({
  summary: z.string(),
  factsAdded: z.array(z.string()).max(MEMORY.factsPerSummary),
});

const SUMMARY_JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    factsAdded: { type: "array", items: { type: "string" }, maxItems: MEMORY.factsPerSummary },
  },
  required: ["summary", "factsAdded"],
  additionalProperties: false,
} as const;

export function episodeText(playerAction: string, narrativeText: string): string {
  return `Player: ${playerAction}\nNarrator: ${narrativeText}`;
}

async function summarise(
  payload: MemoryJob,
  request: NonNullable<MemoryJob["summarise"]>,
): Promise<MemoryReady> {
  const turns = [...request.earlierTurns, episodeText(payload.playerAction, payload.narrativeText)];
  const result = await completeStructured(
    [
      {
        role: "system",
        content: `${MEMORY.summariser.join(" ")} Character limit: ${MEMORY.summaryMaxChars}.`,
      },
      {
        role: "user",
        content: `Summary so far:\n${request.previous || "(none yet)"}\n\nNew turns:\n${turns.join("\n\n")}`,
      },
    ],
    "story_summary",
    SUMMARY_JSON_SCHEMA,
    (raw) => summarySchema.parse(raw),
  );
  return {
    turnId: payload.turnId,
    summary: result.summary.slice(0, MEMORY.summaryMaxChars),
    factsAdded: result.factsAdded.map((fact) => fact.trim()).filter((fact) => fact.length > 0),
  };
}

export async function rememberTurn(job: Job<MemoryJob>): Promise<void> {
  const payload = memoryJobSchema.parse(job.data);
  const text = episodeText(payload.playerAction, payload.narrativeText);
  const [vector] = await embedTexts([text], "document");
  if (vector === undefined) throw new Error("Embedding server returned no vector");

  await rememberEpisode(
    {
      turnId: payload.turnId,
      worldId: payload.worldId,
      characterId: payload.characterId,
      text,
      createdAt: Date.now(),
    },
    vector,
  );

  if (payload.summarise === null) return;
  const ready = await summarise(payload, payload.summarise);
  await publisher().publish(MEMORY_CHANNEL, JSON.stringify(ready));
}
