import { splitIntoSentences } from "../turns";

export interface AttributedSentence {
  text: string;
  speakerId: string | null;
}

export interface CastName {
  id: string;
  name: string;
}

const QUOTES = /^["“”'‘’]+|["“”'‘’]+$/gu;

function stripQuotes(text: string): string {
  return text.trim().replace(QUOTES, "").trim();
}

function matchSpeaker(line: string, cast: readonly CastName[]): CastName | null {
  const colon = line.indexOf(":");
  if (colon <= 0 || colon > 60) return null;
  const label = line.slice(0, colon).trim().toLowerCase();
  if (label.length === 0) return null;
  return (
    cast.find((actor) => {
      const name = actor.name.toLowerCase();
      return label === name || label === (name.split(" ")[0] ?? name);
    }) ?? null
  );
}

export function parseAttributedLines(
  narrative: string,
  cast: readonly CastName[],
): AttributedSentence[] {
  const out: AttributedSentence[] = [];

  for (const raw of narrative.split(/\r?\n/u)) {
    const line = raw.trim();
    if (line.length === 0) continue;

    const speaker = matchSpeaker(line, cast);
    if (speaker === null) {
      for (const text of splitIntoSentences(stripQuotes(line))) {
        out.push({ text, speakerId: null });
      }
      continue;
    }

    const spoken = stripQuotes(line.slice(line.indexOf(":") + 1));
    if (spoken.length === 0) continue;
    for (const text of splitIntoSentences(spoken)) {
      out.push({ text, speakerId: speaker.id });
    }
  }

  return out;
}

export function spokenBy(sentences: readonly AttributedSentence[]): string[] {
  const seen: string[] = [];
  for (const sentence of sentences) {
    if (sentence.speakerId === null || seen.includes(sentence.speakerId)) continue;
    seen.push(sentence.speakerId);
  }
  return seen;
}
