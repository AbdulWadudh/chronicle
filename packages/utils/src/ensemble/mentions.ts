import type { CastName } from "./dialogue";

function quoteMeta(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function namedIn(action: string, actor: CastName): boolean {
  const full = quoteMeta(actor.name);
  if (new RegExp(`@\\s*${full}\\b`, "iu").test(action)) return true;

  const first = actor.name.split(" ")[0] ?? actor.name;
  if (new RegExp(`@\\s*${quoteMeta(first)}\\b`, "iu").test(action)) return true;

  return new RegExp(`\\b${full}\\b`, "u").test(action);
}

export function mentionedIn(
  action: string,
  cast: readonly CastName[],
  explicitIds: readonly string[] = [],
): string[] {
  const ids: string[] = [];
  for (const id of explicitIds) {
    if (cast.some((actor) => actor.id === id) && !ids.includes(id)) ids.push(id);
  }
  for (const actor of cast) {
    if (ids.includes(actor.id)) continue;
    if (namedIn(action, actor)) ids.push(actor.id);
  }
  return ids;
}
