import { API } from "@chronicle/config";
import { Globe02Icon, PlusSignIcon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "~/components/common/PageHeader";
import { type Page, PaginatedList } from "~/components/common/PaginatedList";
import { Screen } from "~/components/common/Screen";
import { UserMenu } from "~/components/common/UserMenu";
import { Segmented, type SegmentedOption } from "~/components/ui/segmented";
import { get } from "~/lib/api";
import type { WorldSummary } from "~/lib/entities";
import { CreateWorldDialog } from "./CreateWorldDialog";
import { WorldCard } from "./WorldCard";

type Scope = "mine" | "community";

const SCOPES: readonly SegmentedOption<Scope>[] = [
  { value: "mine", label: "My Worlds", icon: UserIcon },
  { value: "community", label: "Community", icon: Globe02Icon },
];

export function Worlds() {
  const navigate = useNavigate();
  const [scope, setScope] = useState<Scope>("mine");
  const [creating, setCreating] = useState(false);

  const loadPage = useCallback(
    async (cursor: string | null, signal: AbortSignal): Promise<Page<WorldSummary>> => {
      const query = new URLSearchParams({ scope });
      if (cursor !== null) query.set("cursor", cursor);
      signal.throwIfAborted();
      return get<Page<WorldSummary>>(`${API.worlds}?${query.toString()}`);
    },
    [scope],
  );

  function openWorld(worldId: string): void {
    void navigate(`/character-select?worldId=${worldId}`);
  }

  return (
    <Screen width="wide">
      <PageHeader
        title="Chronicle"
        trailing={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="pressable flex min-h-11 items-center gap-2 rounded-control bg-primary px-4 text-[0.8125rem] font-semibold text-primary-foreground"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={1.75} />
              New world
            </button>
            <UserMenu />
          </div>
        }
      />

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
        listClassName="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        emptyIcon={Globe02Icon}
        emptyLabel={scope === "mine" ? "No worlds yet" : "Nothing shared yet"}
        emptyBody={
          scope === "mine"
            ? "Describe a premise and the game master will draft the setting, its opening and the abilities that matter in it."
            : "Nobody has published a public world yet. Anything you mark Community will show up here."
        }
        renderItem={(world, index) => (
          <WorldCard world={world} index={index} onOpen={() => openWorld(world.id)} />
        )}
      />

      <CreateWorldDialog
        visible={creating}
        onClose={() => setCreating(false)}
        onCreated={(world) => {
          setCreating(false);
          openWorld(world.id);
        }}
      />
    </Screen>
  );
}
