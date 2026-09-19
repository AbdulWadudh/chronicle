import { API } from "@chronicle/shared";
import { Globe2, Settings2 } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "~/components/common/PageHeader";
import { type Page, PaginatedList } from "~/components/common/PaginatedList";
import { Screen } from "~/components/common/Screen";
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

export function Worlds() {
  const navigate = useNavigate();
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
    <Screen wide>
      <PageHeader
        title="Chronicle"
        trailing={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void navigate("/settings")}
              aria-label="Runtime settings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-text-accent"
            >
              <Settings2 size={16} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full px-3 py-2 text-[13px] text-text-muted"
            >
              Sign out
            </button>
          </div>
        }
      />

      <div className="flex shrink-0 gap-2 pb-4" role="tablist" aria-label="World scope">
        {SCOPES.map((option) => (
          <button
            type="button"
            key={option.key}
            role="tab"
            aria-selected={scope === option.key}
            onClick={() => setScope(option.key)}
            className={`rounded-full px-4 py-2 text-[13px] ${
              scope === option.key
                ? "bg-primary font-medium text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <PaginatedList
        key={scope}
        loadPage={loadPage}
        keyExtractor={(world) => world.id}
        emptyIcon={Globe2}
        emptyLabel={scope === "mine" ? "No worlds yet" : "Nothing shared yet"}
        emptyBody={
          scope === "mine"
            ? "Worlds you create appear here. Browse Community to play something someone else has published."
            : "Nobody has published a public world yet. Anything you mark public will show up here."
        }
        renderItem={(world) => (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => void navigate(`/character-select?worldId=${world.id}`)}
            className="w-full overflow-hidden rounded-2xl border border-card-border bg-card text-left"
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
          </motion.button>
        )}
      />
    </Screen>
  );
}
