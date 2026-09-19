import {
  API,
  baselineStats,
  isValidBuild,
  type StatBlock,
  type StatDefinition,
} from "@chronicle/shared";
import { UserMultipleIcon } from "@hugeicons/core-free-icons";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { PointBuyStepper } from "~/components/character/PointBuyStepper";
import { AppModal } from "~/components/common/AppModal";
import { BackButton } from "~/components/common/BackButton";
import { PageHeader } from "~/components/common/PageHeader";
import { type Page, PaginatedList } from "~/components/common/PaginatedList";
import { Screen } from "~/components/common/Screen";
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

export function CharacterSelect() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const worldId = params.get("worldId");

  const [world, setWorld] = useState<WorldDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [stats, setStats] = useState<StatBlock>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (worldId === null) return;
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
      void navigate(`/play/${created.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create character.");
    }
  }

  const buildValid =
    world !== null &&
    name.trim().length > 0 &&
    isValidBuild(stats, world.statDefinitionsJson, world.pointBudget);

  return (
    <Screen width="wide">
      <PageHeader
        title={world?.title ?? "Choose a character"}
        leading={<BackButton onPress={() => void navigate(-1)} />}
        trailing={
          <button
            type="button"
            onClick={() => setCreating(true)}
            disabled={world === null}
            className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-40"
          >
            New
          </button>
        }
      />

      {error !== null ? (
        <p role="alert" className="pb-2 text-danger">
          {error}
        </p>
      ) : null}

      <PaginatedList
        loadPage={loadPage}
        autoLoadMore={false}
        keyExtractor={(character) => character.id}
        emptyIcon={UserMultipleIcon}
        emptyLabel="No characters yet"
        emptyBody="Create one to start a story in this world. You will pick their abilities with the point-buy budget."
        renderItem={(character) => (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => void navigate(`/play/${character.id}`)}
            className="flex w-full flex-col gap-1 rounded-[var(--radius-card)] border-[length:var(--border-width-card)] border-card-border bg-card p-4 text-left"
          >
            <h2 className="text-lg font-semibold text-text-primary">{character.name}</h2>
            <p className="line-clamp-2 text-sm text-text-secondary">{character.bio}</p>
          </motion.button>
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
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          aria-label="Character name"
          className="rounded-[var(--radius-control)] border-[length:var(--border-width-card)] border-card-border bg-input-surface px-4 py-3 text-text-primary outline-none placeholder:text-text-muted"
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
    </Screen>
  );
}
