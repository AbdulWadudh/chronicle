import type { MemorySettings } from "@chronicle/config";
import { embedTexts, recallEpisodes } from "@chronicle/db";
import type { TurnNode } from "@chronicle/utils";

export function recallableTurnIds(ancestry: readonly TurnNode[], historyDepth: number): string[] {
  return ancestry.slice(0, -historyDepth).map((turn) => turn.id);
}

export async function recallFor(
  ancestry: readonly TurnNode[],
  action: string,
  prompt: { historyDepth: number },
  memory: MemorySettings,
): Promise<string[]> {
  const turnIds = recallableTurnIds(ancestry, prompt.historyDepth);
  if (memory.recallDepth === 0 || turnIds.length === 0) return [];
  try {
    const [vector] = await embedTexts([action], "query");
    if (vector === undefined) return [];
    const episodes = await recallEpisodes(turnIds, vector, memory.recallDepth);
    const order = new Map(turnIds.map((id, index) => [id, index]));
    console.log(`[director] recalled ${episodes.length} of ${turnIds.length} older turns`);
    return episodes
      .sort((a, b) => (order.get(a.turnId) ?? 0) - (order.get(b.turnId) ?? 0))
      .map((episode) => episode.text);
  } catch (error) {
    console.warn("[director] recall skipped, narrating without memory:", error);
    return [];
  }
}
