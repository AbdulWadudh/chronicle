import { ShieldKeyIcon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { BackButton } from "~/components/common/BackButton";
import { EmptyState } from "~/components/common/EmptyState";
import { PageHeader } from "~/components/common/PageHeader";
import { Screen } from "~/components/common/Screen";
import { Spinner } from "~/components/common/Spinner";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useAdmin } from "./useAdmin";

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
  const admin = useAdmin();

  const header = (
    <PageHeader
      title={title}
      leading={<BackButton onPress={() => void navigate(-1)} />}
      trailing={trailing}
    />
  );

  if (admin !== "admin") {
    return (
      <Screen width="wide">
        {header}
        {admin === "checking" ? (
          <div className="flex flex-1 items-center justify-center text-text-muted">
            <Spinner size={22} label="Checking access" />
          </div>
        ) : (
          <EmptyState
            icon={ShieldKeyIcon}
            title={admin === "denied" ? "Not an admin account" : "The director is unreachable"}
            body={
              admin === "denied"
                ? "These controls need the admin role. Ask an existing admin to promote this account from Admin → Accounts, or sign in with one that already has it."
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
          className="mb-3 shrink-0 rounded-control border-(length:--border-width-card) border-danger/30 bg-danger/10 px-3 py-2 text-[0.75rem] text-danger"
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
          <div className="flex flex-col gap-4 pr-[calc(var(--shadow-offset)+0.25rem)] pb-8">
            {children}
          </div>
        </ScrollArea>
      )}
    </Screen>
  );
}
