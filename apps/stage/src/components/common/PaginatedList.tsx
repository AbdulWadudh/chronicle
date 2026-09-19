import { type ReactElement, useEffect, useRef } from "react";
import { Spinner } from "./Spinner";
import { type PageLoader, usePaginatedData } from "./usePaginatedData";

export type { Page, PageLoader } from "./usePaginatedData";

export interface PaginatedListProps<T> {
  loadPage: PageLoader<T>;
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  emptyLabel: string;
  autoLoadMore?: boolean;
  numColumns?: number;
  header?: ReactElement;
}

export function PaginatedList<T>({
  loadPage,
  keyExtractor,
  renderItem,
  emptyLabel,
  autoLoadMore = true,
  numColumns,
  header,
}: PaginatedListProps<T>) {
  const data = usePaginatedData(loadPage);
  const sentinel = useRef<HTMLDivElement>(null);
  const loadMore = data.loadMore;

  useEffect(() => {
    const target = sentinel.current;
    if (!autoLoadMore || target === null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "240px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [autoLoadMore, loadMore]);

  const columns =
    numColumns !== undefined && numColumns > 1
      ? { display: "grid", gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))` }
      : undefined;

  return (
    <div className="scrollbar-none flex flex-1 flex-col overflow-y-auto">
      {header}
      {data.items.length === 0 && !data.loading ? (
        <p className="py-12 text-center text-text-muted">{data.error ?? emptyLabel}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0" style={columns}>
          {data.items.map((item) => (
            <li key={keyExtractor(item)}>{renderItem(item)}</li>
          ))}
        </ul>
      )}

      <div ref={sentinel} className="flex flex-col items-center gap-2 py-4">
        {data.loading ? <Spinner /> : null}
        {!autoLoadMore && !data.exhausted && !data.loading ? (
          <button
            type="button"
            onClick={data.loadMore}
            className="rounded-xl bg-secondary px-5 py-2.5 font-medium text-secondary-foreground"
          >
            Load more
          </button>
        ) : null}
        {data.error !== null && data.items.length > 0 ? (
          <p className="text-sm text-danger">{data.error}</p>
        ) : null}
      </div>
    </div>
  );
}
