import { type BondBand, ENSEMBLE } from "@chronicle/config";

export function bondKey(fromId: string, toId: string): string {
  return `${fromId}>${toId}`;
}

export function bondBetween(
  bonds: Readonly<Record<string, number>>,
  fromId: string,
  toId: string,
): number {
  return bonds[bondKey(fromId, toId)] ?? 0;
}

export function bondBand(value: number): BondBand {
  const { bands } = ENSEMBLE.bonds;
  let found: BondBand | undefined;
  for (const band of bands) {
    if (value >= band.atLeast) found = band;
  }
  if (found !== undefined) return found;
  const first = bands[0];
  if (first === undefined) throw new Error("ENSEMBLE.bonds.bands is empty");
  return first;
}

export interface BondLine {
  from: string;
  to: string;
  phrase: string;
  delivery: string;
}

export function describeBonds(
  bonds: Readonly<Record<string, number>>,
  cast: readonly { id: string; name: string }[],
): BondLine[] {
  const lines: BondLine[] = [];
  for (const from of cast) {
    for (const to of cast) {
      if (from.id === to.id) continue;
      const value = bondBetween(bonds, from.id, to.id);
      const band = bondBand(value);
      if (band.id === "neutral") continue;
      lines.push({ from: from.name, to: to.name, phrase: band.phrase, delivery: band.delivery });
    }
  }
  return lines;
}
