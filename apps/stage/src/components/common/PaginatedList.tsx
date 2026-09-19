import type { ReactElement } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
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

const LIST_CONTENT_STYLE = { gap: 12, padding: 16 } as const;
const COLUMN_STYLE = { gap: 12 } as const;

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
  const showLoadMoreButton = !autoLoadMore && !data.exhausted && !data.loading;

  return (
    <FlatList
      data={data.items}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => renderItem(item)}
      numColumns={numColumns}
      ListHeaderComponent={header}
      contentContainerStyle={LIST_CONTENT_STYLE}
      columnWrapperStyle={numColumns !== undefined && numColumns > 1 ? COLUMN_STYLE : undefined}
      refreshControl={<RefreshControl refreshing={data.refreshing} onRefresh={data.refresh} />}
      onEndReached={autoLoadMore ? data.loadMore : undefined}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        data.loading ? null : (
          <Text className="py-12 text-center text-text-muted">{data.error ?? emptyLabel}</Text>
        )
      }
      ListFooterComponent={
        <View className="items-center py-4">
          {data.loading ? <ActivityIndicator /> : null}
          {showLoadMoreButton ? (
            <Pressable
              onPress={data.loadMore}
              accessibilityRole="button"
              className="rounded-xl bg-secondary px-5 py-2.5 active:opacity-80"
            >
              <Text className="font-medium text-secondary-foreground">Load more</Text>
            </Pressable>
          ) : null}
          {data.error !== null && data.items.length > 0 ? (
            <Text className="text-sm text-danger">{data.error}</Text>
          ) : null}
        </View>
      }
    />
  );
}
