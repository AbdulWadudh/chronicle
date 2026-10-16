import { ENSEMBLE, type EnsembleSettings } from "@chronicle/config";
import { type ChronicleDatabase, schema, toCharacter } from "@chronicle/db";
import {
  type AttributedSentence,
  bondKey,
  type Character,
  mentionedIn,
  pickSpeakers,
  spokenBy,
  type TurnNode,
  type WorldState,
} from "@chronicle/utils";
import { and, eq, ne } from "drizzle-orm";

export interface EnsembleCast {
  present: Character[];
  speakers: Character[];
  absent: Character[];
}

export async function worldCast(
  database: ChronicleDatabase,
  worldId: string,
  protagonistId: string,
): Promise<Character[]> {
  const rows = await database
    .select()
    .from(schema.characters)
    .where(and(eq(schema.characters.worldId, worldId), ne(schema.characters.id, protagonistId)))
    .all();
  return rows.map((row) => toCharacter(row));
}

export function presentFor(cast: readonly Character[], parent: TurnNode | undefined): Character[] {
  const recorded = parent?.cast?.present;
  if (recorded !== undefined && recorded.length > 0) {
    return cast.filter((actor) => recorded.includes(actor.id));
  }

  if (parent === undefined) return cast.slice(0, ENSEMBLE.presenceSeed);

  const named = mentionedIn(parent.narrativeText, cast);
  return cast.filter((actor) => named.includes(actor.id)).slice(0, ENSEMBLE.presenceSeed);
}

function recentSpeakers(ancestry: readonly TurnNode[], depth: number): string[] {
  const seen: string[] = [];
  for (const turn of ancestry.slice(-depth).reverse()) {
    for (const entry of turn.audioUrls) {
      if (entry.speakerId === null || seen.includes(entry.speakerId)) continue;
      seen.push(entry.speakerId);
    }
  }
  return seen;
}

export function chooseCast(input: {
  cast: readonly Character[];
  parent: TurnNode | undefined;
  ancestry: readonly TurnNode[];
  action: string;
  mentionedIds: readonly string[];
  state: WorldState;
  settings: EnsembleSettings;
}): EnsembleCast {
  const mentionedIds = mentionedIn(input.action, input.cast, input.mentionedIds);
  const present = presentFor(input.cast, input.parent);
  const absent = input.cast.filter(
    (actor) => mentionedIds.includes(actor.id) && !present.some((here) => here.id === actor.id),
  );
  const recent = recentSpeakers(input.ancestry, ENSEMBLE.presenceSeed);

  const ids = pickSpeakers({
    present: present.map((actor) => ({
      id: actor.id,
      name: actor.name,
      eagerness: actor.eagerness,
    })),
    mentionedIds,
    recentSpeakerIds: recent,
    bonds: input.state.bonds,
    lastSpeakerId: recent[0] ?? null,
    maxSpeakers: input.settings.maxSpeakers,
    speakChance: input.settings.speakChance,
  });

  const byId = new Map(present.map((actor) => [actor.id, actor]));
  const speakers = ids.flatMap((id) => {
    const actor = byId.get(id);
    return actor === undefined ? [] : [actor];
  });

  return { present, speakers, absent };
}

export function voiceIndex(cast: readonly Character[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const actor of cast) {
    if (actor.voiceId !== null && actor.voiceId.length > 0) index.set(actor.id, actor.voiceId);
  }
  return index;
}

export function resolveBondDeltas(
  deltas: readonly { from: string; to: string; delta: number }[],
  cast: readonly Character[],
): Record<string, number> {
  const byName = new Map(cast.map((actor) => [actor.name.toLowerCase(), actor.id]));
  const out: Record<string, number> = {};
  for (const entry of deltas) {
    const from = byName.get(entry.from.trim().toLowerCase());
    const to = byName.get(entry.to.trim().toLowerCase());
    if (from === undefined || to === undefined || from === to || entry.delta === 0) continue;
    out[bondKey(from, to)] = (out[bondKey(from, to)] ?? 0) + entry.delta;
  }
  return out;
}

export function resolvePresentAfter(
  names: readonly string[],
  cast: readonly Character[],
): string[] {
  const byName = new Map(cast.map((actor) => [actor.name.toLowerCase(), actor.id]));
  const ids: string[] = [];
  for (const name of names) {
    const id = byName.get(name.trim().toLowerCase());
    if (id !== undefined && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function speakersOf(sentences: readonly AttributedSentence[]): string[] {
  return spokenBy(sentences);
}
