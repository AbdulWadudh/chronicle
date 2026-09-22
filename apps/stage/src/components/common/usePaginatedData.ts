import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

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

export function usePaginatedData<T>(
  queryKey: readonly unknown[],
  loadPage: PageLoader<T>,
): PaginatedData<T> {
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => loadPage(pageParam, signal),
    getNextPageParam: (page: Page<T>) => page.nextCursor,
  });

  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items),
    [query.data],
  );

  const loadMore = useCallback(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    void query.fetchNextPage();
  }, [query]);

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    items,
    loading: query.isFetching,
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    exhausted: !query.hasNextPage,
    error: query.error === null ? null : query.error.message,
    loadMore,
    refresh,
  };
}
