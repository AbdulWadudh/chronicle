import { API } from "@chronicle/config";
import { Globe02Icon, UserIcon } from "@hugeicons/core-free-icons";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "~/components/common/PageHeader";
import { type Page, PaginatedList } from "~/components/common/PaginatedList";
import { Screen } from "~/components/common/Screen";
import { UserMenu } from "~/components/common/UserMenu";
import { Segmented, type SegmentedOption } from "~/components/ui/segmented";
import { get } from "~/lib/api";

interface WorldRow {
  id: string;
  title: string;
  description: string;
  genre: string;
  coverImageUrl: string | null;
  visibility: "private" | "public";
}

type Scope = "mine" | "community";

const SCOPES: readonly SegmentedOption<Scope>[] = [
  { value: "mine", label: "My Worlds", icon: UserIcon },
  { value: "community", label: "Community", icon: Globe02Icon },
];

export function Worlds() {
  const navigate = useNavigate();
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
    <Screen width="wide">
      <PageHeader title="Chronicle" trailing={<UserMenu />} />

      <div className="shrink-0 pb-4 sm:max-w-85">
        <Segmented
          value={scope}
          options={SCOPES}
          onValueChange={setScope}
          ariaLabel="World scope"
        />
      </div>

      <PaginatedList
        key={scope}
        loadPage={loadPage}
        keyExtractor={(world) => world.id}
        emptyIcon={Globe02Icon}
        emptyLabel={scope === "mine" ? "No worlds yet" : "Nothing shared yet"}
        emptyBody={
          scope === "mine"
            ? "Worlds you create appear here. Browse Community to play something someone else has published."
            : "Nobody has published a public world yet. Anything you mark public will show up here."
        }
        renderItem={(world, index) => (
          <button
            type="button"
            style={{ ["--rise-index" as string]: index }}
            onClick={() => void navigate(`/character-select?worldId=${world.id}`)}
            className="pressable rise-in w-full cursor-pointer overflow-hidden rounded-(--radius-card) border-(length:--border-width-card) border-card-border bg-card text-left hover:border-hairline-strong"
          >
            {world.coverImageUrl !== null ? (
              <img
                src={world.coverImageUrl}
                alt=""
                className="h-40 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-40 w-full bg-secondary" />
            )}
            <div className="flex flex-col gap-1 p-4">
              <h2 className="text-lg font-semibold text-text-primary">{world.title}</h2>
              <p className="text-sm text-text-muted">{world.genre}</p>
              <p className="line-clamp-2 text-sm text-text-secondary">{world.description}</p>
            </div>
          </button>
        )}
      />
    </Screen>
  );
}
