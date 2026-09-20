import { API } from "@chronicle/config";
import { ShieldKeyIcon, UserIcon, UserRemove01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertDialog } from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { ApiError, get, patch } from "~/lib/api";
import { AdminScreen } from "./AdminScreen";

type Role = "user" | "admin";

interface Account {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface AccountsBody {
  accounts: Account[];
  currentUserId: string;
}

function reasonOf(cause: unknown): string {
  if (!(cause instanceof ApiError)) return "The director did not answer.";
  try {
    const body: unknown = JSON.parse(cause.message);
    if (typeof body === "object" && body !== null && "error" in body) {
      const { error } = body as { error: unknown };
      if (typeof error === "string") return error;
    }
  } catch {
    return cause.message;
  }
  return cause.message;
}

function AccountRow({
  account,
  isSelf,
  busy,
  index,
  onSetRole,
}: {
  account: Account;
  isSelf: boolean;
  busy: boolean;
  index: number;
  onSetRole: (role: Role) => void;
}) {
  const isAdmin = account.role === "admin";

  return (
    <div
      style={{ ["--rise-index" as string]: index }}
      className="raise rise-in flex flex-wrap items-center gap-3 rounded-card border-(length:--border-width-card) border-hairline bg-raised px-4 py-3.5"
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-control border-(length:--border-width-card) ${
          isAdmin
            ? "border-primary/25 bg-primary/[0.08] text-text-accent"
            : "border-hairline bg-sunken text-text-muted"
        }`}
      >
        <HugeiconsIcon icon={isAdmin ? ShieldKeyIcon : UserIcon} size={17} strokeWidth={1.5} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[0.875rem] font-medium text-text-primary">
          <span className="truncate">{account.name}</span>
          {isSelf ? (
            <span className="shrink-0 rounded-control border-(length:--border-width-card) border-hairline px-1.5 py-0.5 text-[0.5625rem] font-medium tracking-[0.08em] text-text-muted uppercase">
              You
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-[0.75rem] text-text-muted">
          {account.email}
        </span>
      </span>

      <span
        className={`shrink-0 rounded-control px-2.5 py-1 text-[0.6875rem] font-medium ${
          isAdmin ? "bg-primary/15 text-text-accent" : "bg-sunken text-text-muted"
        }`}
      >
        {isAdmin ? "Admin" : "User"}
      </span>

      <Button
        variant={isAdmin ? "outline" : "default"}
        size="sm"
        disabled={busy}
        onClick={() => onSetRole(isAdmin ? "user" : "admin")}
      >
        {isAdmin ? "Make user" : "Make admin"}
      </Button>
    </div>
  );
}

interface PendingChange {
  account: Account;
  role: Role;
  isSelf: boolean;
}

function confirmCopy(pending: PendingChange | null): { title: string; body: string } {
  if (pending === null) return { title: "Change this role?", body: "" };
  if (pending.role === "admin") {
    return {
      title: `Make ${pending.account.name} an admin?`,
      body: "They will be able to open every operator screen, change runtime settings that affect every session, and promote or demote any account — including yours.",
    };
  }
  return {
    title: `Remove ${pending.account.name}'s admin role?`,
    body: pending.isSelf
      ? "You lose these operator screens the moment this lands, and only another admin can give them back."
      : "They keep their worlds and characters, but lose every operator screen. Another admin can restore it later.",
  };
}

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let abandoned = false;
    get<AccountsBody>(`${API.admin}/accounts`)
      .then((body) => {
        if (abandoned) return;
        setAccounts(body.accounts);
        setCurrentUserId(body.currentUserId);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (abandoned) return;
        setError(reasonOf(cause));
        setLoading(false);
      });
    return () => {
      abandoned = true;
    };
  }, []);

  const setRole = useCallback((account: Account, role: Role) => {
    setBusyId(account.id);
    patch<{ role: Role }>(`${API.admin}/accounts/${account.id}`, { role })
      .then((body) => {
        setAccounts((rows) =>
          rows.map((row) => (row.id === account.id ? { ...row, role: body.role } : row)),
        );
        toast.success(
          body.role === "admin"
            ? `${account.name} is now an admin`
            : `${account.name} is now a user`,
        );
      })
      .catch((cause: unknown) => {
        toast.error("Role unchanged", { description: reasonOf(cause) });
      })
      .finally(() => setBusyId(null));
  }, []);

  return (
    <AdminScreen
      title="Accounts"
      blurb="Every account on this installation. An admin can open every operator screen, so promote deliberately."
      loading={loading}
      error={error}
    >
      {accounts.map((account, index) => (
        <AccountRow
          key={account.id}
          account={account}
          index={index}
          isSelf={account.id === currentUserId}
          busy={busyId === account.id}
          onSetRole={(role) => {
            setPending({ account, role, isSelf: account.id === currentUserId });
            setConfirming(true);
          }}
        />
      ))}

      <AlertDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={confirmCopy(pending).title}
        description={confirmCopy(pending).body}
        confirmLabel={pending?.role === "admin" ? "Make admin" : "Remove admin"}
        tone={pending?.role === "admin" ? "default" : "destructive"}
        icon={
          <HugeiconsIcon
            icon={pending?.role === "admin" ? ShieldKeyIcon : UserRemove01Icon}
            size={17}
            strokeWidth={1.8}
          />
        }
        onConfirm={() => {
          if (pending !== null) setRole(pending.account, pending.role);
        }}
      />
    </AdminScreen>
  );
}
