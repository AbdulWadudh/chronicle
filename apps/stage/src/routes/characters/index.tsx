import { API } from "@chronicle/config";
import { PlusSignIcon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { BackButton } from "~/components/common/BackButton";
import { PageHeader } from "~/components/common/PageHeader";
import { type Page, PaginatedList } from "~/components/common/PaginatedList";
import { Screen } from "~/components/common/Screen";
import { AlertDialog } from "~/components/ui/alert-dialog";
import { get, remove } from "~/lib/api";
import type { CharacterSummary, WorldDetail } from "~/lib/entities";
import { queryKeys } from "~/lib/queryKeys";
import { CharacterCard } from "./CharacterCard";
import { CharacterDialog } from "./CharacterDialog";
import { WorldBrief } from "./WorldBrief";

export function CharacterSelect() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const worldId = params.get("worldId");

  const [world, setWorld] = useState<WorldDetail | null>(null);
  const [editing, setEditing] = useState<CharacterSummary | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CharacterSummary | null>(null);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (worldId === null) return;
    let cancelled = false;
    void get<WorldDetail>(`${API.worlds}/${worldId}`)
      .then((detail) => {
        if (!cancelled) setWorld(detail);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not load this world.");
      });
    return () => {
      cancelled = true;
    };
  }, [worldId]);

  const loadPage = useCallback(
    async (_cursor: string | null, signal: AbortSignal): Promise<Page<CharacterSummary>> => {
      signal.throwIfAborted();
      const result = await get<{ items: CharacterSummary[] }>(
        `${API.characters}?worldId=${worldId ?? ""}`,
      );
      return { items: result.items, nextCursor: null };
    },
    [worldId],
  );

  async function confirmDelete(): Promise<void> {
    if (pendingDelete === null) return;
    try {
      await remove(`${API.characters}/${pendingDelete.id}`);
      void queryClient.invalidateQueries({ queryKey: ["characters"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That character was not removed.");
    } finally {
      setPendingDelete(null);
    }
  }

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
            className="pressable flex min-h-11 items-center gap-2 rounded-control bg-primary px-4 text-[0.8125rem] font-semibold text-primary-foreground disabled:bg-sunken disabled:text-text-muted"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={1.75} />
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
        queryKey={queryKeys.characters(worldId)}
        loadPage={loadPage}
        autoLoadMore={false}
        keyExtractor={(character) => character.id}
        listClassName="grid gap-3 lg:grid-cols-2"
        header={world === null ? undefined : <WorldBrief world={world} />}
        emptyIcon={UserMultipleIcon}
        emptyLabel="You have no character in this world yet"
        emptyBody="The game master casts three when a world is created. If none appear, create your own — name them, rank the abilities above, and a backstory can be written to fit."
        renderItem={(character, index) => (
          <CharacterCard
            character={character}
            index={index}
            onPlay={() => void navigate(`/play/${character.id}`)}
            onEdit={() => setEditing(character)}
            onDelete={() => setPendingDelete(character)}
          />
        )}
      />

      <CharacterDialog
        visible={creating || editing !== null}
        world={world}
        existing={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={(character) => {
          const wasEditing = editing !== null;
          setCreating(false);
          setEditing(null);
          void queryClient.invalidateQueries({ queryKey: ["characters"] });
          if (!wasEditing) void navigate(`/play/${character.id}`);
        }}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete ${pendingDelete?.name ?? "this character"}?`}
        description="Their story, every committed turn and their portrait go with them. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
      />
    </Screen>
  );
}
