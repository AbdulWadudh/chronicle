import type { StatDefinition } from "@chronicle/utils";
import { type ChatMessage, completeStructured } from "~/engine/llm";

const MIN_STATS = 4;
const MAX_STATS = 6;
const WORLD_DRAFT_TOKENS = 1400;

const statDraftSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    label: { type: "string" },
    description: { type: "string" },
  },
  required: ["id", "label", "description"],
  additionalProperties: false,
} as const;

const WORLD_DRAFT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    genre: { type: "string" },
    description: { type: "string" },
    openingSummary: { type: "string" },
    stats: { type: "array", minItems: MIN_STATS, maxItems: MAX_STATS, items: statDraftSchema },
  },
  required: ["title", "genre", "description", "openingSummary", "stats"],
  additionalProperties: false,
} as const;

interface WorldDraftResponse {
  title: string;
  genre: string;
  description: string;
  openingSummary: string;
  stats: StatDefinition[];
}

export interface WorldDraft {
  title: string;
  genre: string;
  description: string;
  openingSummary: string;
  statDefinitions: StatDefinition[];
}

function slug(value: string, fallback: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
  return cleaned.length > 0 ? cleaned : fallback;
}

function normaliseStats(stats: readonly StatDefinition[]): StatDefinition[] {
  const seen = new Set<string>();
  const normalised: StatDefinition[] = [];
  for (const [index, stat] of stats.entries()) {
    const id = slug(stat.id.length > 0 ? stat.id : stat.label, `stat-${index + 1}`);
    if (seen.has(id)) continue;
    seen.add(id);
    normalised.push({ id, label: stat.label.trim(), description: stat.description.trim() });
  }
  return normalised;
}

function worldDraftPrompt(premise: string): ChatMessage[] {
  return [
    {
      role: "system",
      content: [
        "You design settings for an interactive story.",
        "From the premise, invent a title, a one-word-or-two genre, and two or three sentences of description.",
        "openingSummary is the situation the protagonist starts in, written in second person.",
        `Then invent between ${MIN_STATS} and ${MAX_STATS} abilities that matter in this setting.`,
        "Each ability has a lowercase hyphenated id, a short label, and one sentence saying when it is tested.",
        "Abilities must suit the premise, never a generic fantasy list.",
      ].join(" "),
    },
    { role: "user", content: premise },
  ];
}

export async function draftWorld(premise: string, signal?: AbortSignal): Promise<WorldDraft> {
  const draft = await completeStructured<WorldDraftResponse>(worldDraftPrompt(premise), {
    schemaName: "world_draft",
    schema: WORLD_DRAFT_SCHEMA,
    maxTokens: WORLD_DRAFT_TOKENS,
    signal,
  });
  return {
    title: draft.title.trim(),
    genre: draft.genre.trim(),
    description: draft.description.trim(),
    openingSummary: draft.openingSummary.trim(),
    statDefinitions: normaliseStats(draft.stats),
  };
}
