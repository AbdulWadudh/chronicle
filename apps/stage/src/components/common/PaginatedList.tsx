import { AlertCircleIcon, InboxIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { type ReactElement, useEffect, useRef } from "react";
import { cn } from "~/lib/utils";
import { EmptyState } from "./EmptyState";
import { Spinner } from "./Spinner";
import { type PageLoader, usePaginatedData } from "./usePaginatedData";

export type { Page, PageLoader } from "./usePaginatedData";

export interface PaginatedListProps<T> {
  queryKey: readonly unknown[];
  loadPage: PageLoader<T>;
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => ReactElement;
  emptyLabel: string;
  emptyBody?: string;
  emptyIcon?: IconSvgElement;
  autoLoadMore?: boolean;
  listClassName?: string;
  header?: ReactElement;
}

export function PaginatedList<T>({
  queryKey,
  loadPage,
  keyExtractor,
  renderItem,
  emptyLabel,
  emptyBody,
  emptyIcon = InboxIcon,
  autoLoadMore = true,
  listClassName,
  header,
}: PaginatedListProps<T>) {
  const data = usePaginatedData(queryKey, loadPage);
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

  const isEmpty = data.items.length === 0;

  if (isEmpty && data.error !== null) {
    return (
      <div className="scrollbar-none flex flex-1 flex-col overflow-y-auto">
        {header}
        <EmptyState icon={AlertCircleIcon} title="That did not load" body={data.error} />
      </div>
    );
  }

  if (isEmpty && !data.loading) {
    return (
      <div className="scrollbar-none flex flex-1 flex-col overflow-y-auto">
        {header}
        <EmptyState icon={emptyIcon} title={emptyLabel} body={emptyBody} />
      </div>
    );
  }

  return (
    <div className="scrollbar-none flex flex-1 flex-col overflow-y-auto pr-[calc(var(--shadow-offset)+0.25rem)]">
      {header}
      <ul className={cn("m-0 flex list-none flex-col gap-3 p-0", listClassName)}>
        {data.items.map((item, index) => (
          <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
        ))}
      </ul>

      <div ref={sentinel} className="flex shrink-0 flex-col items-center gap-2 py-4">
        {data.loading ? <Spinner /> : null}
        {!autoLoadMore && !data.exhausted && !data.loading ? (
          <button
            type="button"
            onClick={data.loadMore}
            className="rounded-control bg-secondary px-5 py-2.5 font-medium text-secondary-foreground"
          >
            Load more
          </button>
        ) : null}
        {data.error !== null ? <p className="text-sm text-danger">{data.error}</p> : null}
      </div>
    </div>
  );
}
