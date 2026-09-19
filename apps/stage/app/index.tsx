import { API } from "@chronicle/shared";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { type Page, PaginatedList } from "~/components/common/PaginatedList";
import { get } from "~/lib/api";
import { useAuth } from "~/lib/auth";

interface WorldRow {
  id: string;
  title: string;
  description: string;
  genre: string;
  coverImageUrl: string | null;
  visibility: "private" | "public";
}

type Scope = "mine" | "community";

const SCOPES: { key: Scope; label: string }[] = [
  { key: "mine", label: "My Worlds" },
  { key: "community", label: "Community" },
];

export default function WorldSelectScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [scope, setScope] = useState<Scope>("mine");

  const loadPage = useCallback(
    async (cursor: string | null, signal: AbortSignal): Promise<Page<WorldRow>> => {
      const query = new URLSearchParams({ scope });
      if (cursor !== null) query.set("cursor", cursor);
      signal.throwIfAborted();
      return get<Page<WorldRow>>(`${API.worlds}?${query.toString()}`);
    },
    [scope],
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-4 pt-2">
        <Text className="text-2xl font-semibold text-text-primary">Chronicle</Text>
        <Pressable onPress={() => void signOut()} hitSlop={8} accessibilityRole="button">
          <Text className="text-text-muted">Sign out</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-2 px-4 pt-4">
        {SCOPES.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setScope(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: scope === option.key }}
            className={`rounded-full px-4 py-2 ${scope === option.key ? "bg-primary" : "bg-secondary"}`}
          >
            <Text
              className={
                scope === option.key
                  ? "font-medium text-primary-foreground"
                  : "text-secondary-foreground"
              }
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <PaginatedList
        loadPage={loadPage}
        keyExtractor={(world) => world.id}
        emptyLabel={scope === "mine" ? "No worlds yet." : "Nothing shared yet."}
        renderItem={(world) => (
          <Animated.View entering={FadeIn.duration(200)}>
            <Pressable
              onPress={() =>
                router.push({ pathname: "/character-select", params: { worldId: world.id } })
              }
              accessibilityRole="button"
              className="overflow-hidden rounded-2xl border border-card-border bg-card active:opacity-85"
            >
              {world.coverImageUrl !== null ? (
                <Image
                  source={{ uri: world.coverImageUrl }}
                  className="h-40 w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-40 w-full bg-secondary" />
              )}
              <View className="gap-1 p-4">
                <Text className="text-lg font-semibold text-text-primary">{world.title}</Text>
                <Text className="text-sm text-text-muted">{world.genre}</Text>
                <Text className="text-sm text-text-secondary" numberOfLines={2}>
                  {world.description}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}
