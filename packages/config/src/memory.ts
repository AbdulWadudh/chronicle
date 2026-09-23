import { z } from "zod";

export const MEMORY_BOUNDS = {
  recallDepth: { min: 0, max: 8, step: 1 },
  summaryEvery: { min: 1, max: 10, step: 1 },
} as const;

export const memorySettingsSchema = z.object({
  recallDepth: z
    .number()
    .int()
    .min(MEMORY_BOUNDS.recallDepth.min)
    .max(MEMORY_BOUNDS.recallDepth.max)
    .default(3),
  summaryEvery: z
    .number()
    .int()
    .min(MEMORY_BOUNDS.summaryEvery.min)
    .max(MEMORY_BOUNDS.summaryEvery.max)
    .default(3),
});

export type MemorySettings = z.infer<typeof memorySettingsSchema>;

export const MEMORY = {
  table: "episodes",
  dimensions: 768,
  prefix: { document: "search_document: ", query: "search_query: " },
  summaryMaxChars: 700,
  factsPerSummary: 4,
  recallLead: "Earlier in this story, further back than the turns above:",
  summariser: [
    "You keep the running summary of an interactive story.",
    "Rewrite the summary so it covers everything that has happened so far, oldest first, in plain past tense, third person, under the character limit given.",
    "Keep names, places, promises, injuries, debts and unresolved threats. Drop mood, scenery and repetition.",
    "Then list the new facts these turns established that a later turn must not contradict. Each fact is one short sentence. Return none if nothing new was established.",
  ],
} as const;
