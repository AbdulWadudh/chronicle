import { bondBetween } from "./bonds";

export interface SpeakerCandidate {
  id: string;
  name: string;
  eagerness: number;
}

export interface PickSpeakersInput {
  present: readonly SpeakerCandidate[];
  mentionedIds?: readonly string[];
  recentSpeakerIds?: readonly string[];
  bonds?: Readonly<Record<string, number>>;
  lastSpeakerId?: string | null;
  maxSpeakers: number;
  speakChance: number;
  random?: () => number;
}

const BOND_BOOST = 60;

function recencyFactor(id: string, recent: readonly string[]): number {
  const index = recent.indexOf(id);
  if (index === -1) return 1;
  return (index + 1) / (recent.length + 1);
}

function weightOf(
  candidate: SpeakerCandidate,
  input: PickSpeakersInput,
  recent: readonly string[],
): number {
  const base = candidate.eagerness * recencyFactor(candidate.id, recent);
  const last = input.lastSpeakerId;
  if (input.bonds === undefined || last === null || last === undefined) return base;
  const strength = Math.max(
    Math.abs(bondBetween(input.bonds, candidate.id, last)),
    Math.abs(bondBetween(input.bonds, last, candidate.id)),
  );
  return base * (1 + strength / BOND_BOOST);
}

function weightedPick(pool: SpeakerCandidate[], weights: number[], roll: number): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return -1;
  let cursor = roll * total;
  for (let index = 0; index < pool.length; index += 1) {
    cursor -= weights[index] ?? 0;
    if (cursor <= 0) return index;
  }
  return pool.length - 1;
}

export function pickSpeakers(input: PickSpeakersInput): string[] {
  const random = input.random ?? Math.random;
  const recent = input.recentSpeakerIds ?? [];
  const mentioned = new Set(input.mentionedIds ?? []);

  const forced = input.present.filter((actor) => mentioned.has(actor.id));
  const chosen = forced.slice(0, input.maxSpeakers).map((actor) => actor.id);

  const pool = input.present.filter((actor) => !chosen.includes(actor.id));

  while (chosen.length < input.maxSpeakers && pool.length > 0) {
    if (chosen.length > 0 && random() > input.speakChance) break;
    const weights = pool.map((actor) => weightOf(actor, input, recent));
    const index = weightedPick(pool, weights, random());
    if (index < 0) break;
    const picked = pool.splice(index, 1)[0];
    if (picked === undefined) break;
    chosen.push(picked.id);
  }

  return chosen;
}
