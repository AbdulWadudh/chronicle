import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "~/components/ui/button";

export function AppCrash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-canvas px-8">
      <span className="flex h-14 w-14 items-center justify-center rounded-card border-(length:--border-width-card) border-danger/30 bg-danger/10 text-danger">
        <HugeiconsIcon icon={Alert02Icon} size={22} strokeWidth={1.5} />
      </span>
      <p className="text-center text-[0.9375rem] font-medium text-text-secondary">
        Chronicle hit an error it could not recover from
      </p>
      <p className="max-w-75 text-center text-[0.8125rem] leading-relaxed text-text-muted">
        Your worlds, characters and committed turns are safe on the server. Reloading returns you to
        where you were.
      </p>
      <div className="w-45">
        <Button onClick={() => window.location.reload()}>Reload Chronicle</Button>
      </div>
    </div>
  );
}
