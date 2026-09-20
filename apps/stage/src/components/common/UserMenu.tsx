import { Logout02Icon, Settings02Icon, ShieldKeyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "~/components/ui/menu";
import { useAuth } from "~/lib/auth";
import { useAdmin } from "~/routes/admin/useAdmin";

function initialsOf(name: string, email: string): string {
  const source = name.trim() === "" ? email : name.trim();
  const parts = source.split(/[\s@._-]+/u).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? (parts[1]?.[0] ?? "") : "";
  return `${first}${second}`;
}

export function UserMenu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const admin = useAdmin();

  if (user === null) return null;

  return (
    <Menu>
      <MenuTrigger
        aria-label={`Account menu for ${user.name === "" ? user.email : user.name}`}
        className="cursor-pointer rounded-(--radius-control) outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <Avatar>
          <AvatarFallback>{initialsOf(user.name, user.email)}</AvatarFallback>
        </Avatar>
      </MenuTrigger>

      <MenuContent>
        <div className="px-2.5 py-2">
          <p className="truncate text-[0.8125rem] font-medium text-text-primary">
            {user.name === "" ? "Signed in" : user.name}
          </p>
          <p className="mt-0.5 truncate text-[0.6875rem] text-text-muted">{user.email}</p>
        </div>

        <MenuSeparator />

        <MenuItem onClick={() => void navigate("/settings")}>
          <HugeiconsIcon icon={Settings02Icon} size={15} strokeWidth={1.6} />
          Settings
        </MenuItem>

        {admin === "admin" ? (
          <MenuItem onClick={() => void navigate("/admin")}>
            <HugeiconsIcon icon={ShieldKeyIcon} size={15} strokeWidth={1.6} />
            Admin
          </MenuItem>
        ) : null}

        <MenuSeparator />

        <MenuItem
          onClick={() => void signOut()}
          className="text-danger data-highlighted:bg-danger/10"
        >
          <HugeiconsIcon icon={Logout02Icon} size={15} strokeWidth={1.6} />
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
