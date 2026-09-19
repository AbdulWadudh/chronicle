import { ShieldKeyIcon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { BackButton } from "~/components/common/BackButton";
import { EmptyState } from "~/components/common/EmptyState";
import { PageHeader } from "~/components/common/PageHeader";
import { Screen } from "~/components/common/Screen";
import { Spinner } from "~/components/common/Spinner";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useOwner } from "./useOwner";

export interface AdminScreenProps {
  title: string;
  blurb?: string;
  trailing?: ReactNode;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
}

export function AdminScreen({
  title,
  blurb,
  trailing,
  loading = false,
  error = null,
  children,
}: AdminScreenProps) {
  const navigate = useNavigate();
  const owner = useOwner();

  const header = (
    <PageHeader
      title={title}
      leading={<BackButton onPress={() => void navigate(-1)} />}
      trailing={trailing}
    />
  );

  if (owner !== "owner") {
    return (
      <Screen width="wide">
        {header}
        {owner === "checking" ? (
          <div className="flex flex-1 items-center justify-center text-text-muted">
            <Spinner size={22} label="Checking access" />
          </div>
        ) : (
          <EmptyState
            icon={ShieldKeyIcon}
            title={owner === "denied" ? "Not your installation" : "The director is unreachable"}
            body={
              owner === "denied"
                ? "Only the owner account can open these controls. Set AUTH_OWNER_EMAIL on the director, or sign in as the first account that was registered."
                : "Admin needs the director running. Start it and reload."
            }
          />
        )}
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      {header}

      {blurb === undefined ? null : (
        <p className="shrink-0 pb-3 text-[0.75rem] leading-relaxed text-text-muted">{blurb}</p>
      )}

      {error === null ? null : (
        <p
          role="alert"
          className="mb-3 shrink-0 rounded-[var(--radius-control)] border-[length:var(--border-width-card)] border-danger/30 bg-danger/10 px-3 py-2 text-[0.75rem] text-danger"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-text-muted">
          <Spinner size={22} label={`Loading ${title}`} />
        </div>
      ) : (
        <ScrollArea className="-mr-3 min-h-0 flex-1 pr-3">
          <div className="flex flex-col gap-4 pb-8">{children}</div>
        </ScrollArea>
      )}
    </Screen>
  );
}
