import { API } from "@chronicle/config";
import type { TurnNode } from "@chronicle/utils";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { get } from "~/lib/api";

interface TurnPage {
  items: TurnNode[];
  hasMore: boolean;
}

export interface TurnHistory {
  turns: TurnNode[];
  setTurns: Dispatch<SetStateAction<TurnNode[]>>;
  hasOlderTurns: boolean;
  loadingOlder: boolean;
  loadOlderTurns: () => void;
  error: string | null;
}

function pageUrl(characterId: string, before: string | null): string {
  const cursor = before === null ? "" : `&before=${encodeURIComponent(before)}`;
  return `${API.turns}?characterId=${encodeURIComponent(characterId)}${cursor}`;
}

export function useTurnHistory(
  characterId: string | null,
  onFirstPage: (items: TurnNode[]) => void,
): TurnHistory {
  const [turns, setTurns] = useState<TurnNode[]>([]);
  const [hasOlderTurns, setHasOlderTurns] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requested = useRef<string | null>(null);

  useEffect(() => {
    if (characterId === null) return;
    let cancelled = false;
    void (async () => {
      try {
        const page = await get<TurnPage>(pageUrl(characterId, null));
        if (cancelled) return;
        setTurns(page.items);
        setHasOlderTurns(page.hasMore);
        onFirstPage(page.items);
      } catch (cause) {
        if (!cancelled)
          setError(cause instanceof Error ? cause.message : "Could not load history.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [characterId, onFirstPage]);

  const oldestTurnId = turns[0]?.id ?? null;

  const loadOlderTurns = useCallback(() => {
    if (characterId === null || oldestTurnId === null || !hasOlderTurns) return;
    if (requested.current === oldestTurnId) return;
    requested.current = oldestTurnId;
    setLoadingOlder(true);
    void (async () => {
      try {
        const page = await get<TurnPage>(pageUrl(characterId, oldestTurnId));
        setTurns((previous) => [...page.items, ...previous]);
        setHasOlderTurns(page.hasMore);
      } catch (cause) {
        requested.current = null;
        setError(cause instanceof Error ? cause.message : "Could not load earlier turns.");
      } finally {
        setLoadingOlder(false);
      }
    })();
  }, [characterId, oldestTurnId, hasOlderTurns]);

  return { turns, setTurns, hasOlderTurns, loadingOlder, loadOlderTurns, error };
}
