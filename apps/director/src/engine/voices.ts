import { env } from "@chronicle/config/env";
import { z } from "zod";

const voiceRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  overall_grade: z.string().nullable().optional(),
});

const voiceListSchema = z.object({ voices: z.array(voiceRowSchema) });

const LOCALES: Record<string, string> = {
  a: "American English",
  b: "British English",
  e: "Spanish",
  f: "French",
  h: "Hindi",
  i: "Italian",
  j: "Japanese",
  p: "Portuguese",
  z: "Mandarin",
};

const GENDERS: Record<string, string> = { f: "Female", m: "Male" };

export interface Voice {
  id: string;
  label: string;
  locale: string;
  gender: string;
  grade: string | null;
}

let cache: Voice[] | null = null;

function describe(id: string): Omit<Voice, "id" | "grade"> {
  const locale = LOCALES[id[0] ?? ""] ?? "Other";
  const gender = GENDERS[id[1] ?? ""] ?? "Neutral";
  const stem = id.includes("_") ? (id.split("_")[1] ?? id) : id;
  const name = stem.charAt(0).toUpperCase() + stem.slice(1);
  return { label: name, locale, gender };
}

export async function listVoices(): Promise<Voice[]> {
  if (cache !== null) return cache;

  const endpoint = `${env().TTS_ENDPOINT.replace(/\/+$/u, "")}/v1/audio/voices`;
  const response = await fetch(endpoint).catch((cause: unknown) => {
    throw new Error(`Kokoro is unreachable at ${endpoint}: ${String(cause)}`);
  });
  if (!response.ok) {
    throw new Error(`Kokoro returned ${response.status} for its voice list.`);
  }

  const parsed = voiceListSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Kokoro's voice list did not match the expected shape.");
  }
  if (parsed.data.voices.length === 0) {
    throw new Error("Kokoro reports no installed voices.");
  }

  cache = parsed.data.voices.map((row) => ({
    id: row.id,
    grade: row.overall_grade ?? null,
    ...describe(row.id),
  }));
  return cache;
}

export async function voiceRejection(id: string | null | undefined): Promise<string | null> {
  if (id === null || id === undefined || id.length === 0) return null;
  try {
    const available = await listVoices();
    if (available.some((voice) => voice.id === id)) return null;
    return `Voice "${id}" is not installed on Kokoro.`;
  } catch (error) {
    return error instanceof Error ? error.message : "That voice could not be verified.";
  }
}
