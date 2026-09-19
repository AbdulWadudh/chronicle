import {
  API,
  baselineStats,
  isValidBuild,
  type StatBlock,
  type StatDefinition,
} from "@chronicle/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { PointBuyStepper } from "~/components/character/PointBuyStepper";
import { AppModal } from "~/components/common/AppModal";
import { type Page, PaginatedList } from "~/components/common/PaginatedList";
import { get, post } from "~/lib/api";

interface CharacterRow {
  id: string;
  name: string;
  bio: string;
  statsJson: StatBlock;
}

interface WorldDetail {
  id: string;
  title: string;
  statDefinitionsJson: StatDefinition[];
  pointBudget: number;
}

const FILL = { flex: 1 } as const;
export default function CharacterSelectScreen() {
  const router = useRouter();
  const { worldId } = useLocalSearchParams<{ worldId: string }>();
  const [world, setWorld] = useState<WorldDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [stats, setStats] = useState<StatBlock>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (worldId === undefined) return;
    void get<WorldDetail>(`${API.worlds}/${worldId}`)
      .then((detail) => {
        setWorld(detail);
        setStats(baselineStats(detail.statDefinitionsJson));
      })
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Could not load world."),
      );
  }, [worldId]);

  const loadPage = useCallback(
    async (_cursor: string | null, signal: AbortSignal): Promise<Page<CharacterRow>> => {
      signal.throwIfAborted();
      const result = await get<{ items: CharacterRow[] }>(
        `${API.characters}?worldId=${worldId ?? ""}`,
      );
      return { items: result.items, nextCursor: null };
    },
    [worldId],
  );

  async function createCharacter(): Promise<void> {
    if (world === null) return;
    try {
      const created = await post<CharacterRow>(API.characters, {
        worldId: world.id,
        name: name.trim(),
        stats,
      });
      setCreating(false);
      setName("");
      router.push({ pathname: "/play/[id]", params: { id: created.id } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create character.");
    }
  }

  const buildValid =
    world !== null &&
    name.trim().length > 0 &&
    isValidBuild(stats, world.statDefinitionsJson, world.pointBudget);

  return (
    <SafeAreaView style={FILL} className="bg-canvas">
      <View className="flex-row items-center justify-between px-4 pt-2">
        <Text className="text-xl font-semibold text-text-primary">
          {world?.title ?? "Choose a character"}
        </Text>
        <Pressable
          onPress={() => setCreating(true)}
          disabled={world === null}
          accessibilityRole="button"
          className="rounded-full bg-primary px-4 py-2 active:opacity-85"
        >
          <Text className="font-medium text-primary-foreground">New</Text>
        </Pressable>
      </View>

      {error !== null ? <Text className="px-4 pt-2 text-danger">{error}</Text> : null}

      <PaginatedList
        loadPage={loadPage}
        autoLoadMore={false}
        keyExtractor={(character) => character.id}
        emptyLabel="No characters in this world yet."
        renderItem={(character) => (
          <Animated.View entering={FadeIn.duration(200)}>
            <Pressable
              onPress={() => router.push({ pathname: "/play/[id]", params: { id: character.id } })}
              accessibilityRole="button"
              className="gap-1 rounded-2xl border border-card-border bg-card p-4 active:opacity-85"
            >
              <Text className="text-lg font-semibold text-text-primary">{character.name}</Text>
              <Text className="text-sm text-text-secondary" numberOfLines={2}>
                {character.bio}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      />

      <AppModal
        visible={creating}
        title="Create character"
        onClose={() => setCreating(false)}
        actions={[
          { label: "Cancel", onPress: () => setCreating(false), tone: "secondary" },
          {
            label: "Create",
            onPress: () => void createCharacter(),
            tone: "primary",
            disabled: !buildValid,
          },
        ]}
      >
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          className="rounded-xl border border-card-border bg-input-surface px-4 py-3 text-text-primary"
        />
        {world !== null ? (
          <PointBuyStepper
            definitions={world.statDefinitionsJson}
            stats={stats}
            budget={world.pointBudget}
            onChange={setStats}
          />
        ) : null}
      </AppModal>
    </SafeAreaView>
  );
}
