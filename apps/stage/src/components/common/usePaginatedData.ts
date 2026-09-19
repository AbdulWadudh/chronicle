import { useCallback, useEffect, useRef, useState } from "react";

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export type PageLoader<T> = (cursor: string | null, signal: AbortSignal) => Promise<Page<T>>;

export interface PaginatedData<T> {
  items: T[];
  loading: boolean;
  refreshing: boolean;
  exhausted: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
}

export function usePaginatedData<T>(loadPage: PageLoader<T>): PaginatedData<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (from: string | null, replace: boolean): Promise<void> => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const superseded = (): boolean => controllerRef.current !== controller;

      setLoading(true);
      setError(null);
      try {
        const page = await loadPage(from, controller.signal);
        if (superseded()) return;
        setItems((previous) => (replace ? page.items : [...previous, ...page.items]));
        cursorRef.current = page.nextCursor;
        setExhausted(page.nextCursor === null);
      } catch (cause) {
        if (superseded() || controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Failed to load.");
      } finally {
        if (!superseded()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [loadPage],
  );

  useEffect(() => {
    setItems([]);
    cursorRef.current = null;
    setExhausted(false);
    void fetchPage(null, true);
    return () => controllerRef.current?.abort();
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (exhausted || loading) return;
    void fetchPage(cursorRef.current, false);
  }, [exhausted, fetchPage, loading]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void fetchPage(null, true);
  }, [fetchPage]);

  return { items, loading, refreshing, exhausted, error, loadMore, refresh };
}
