import { HierarchyIcon, PreferenceHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { BackButton } from "~/components/common/BackButton";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import type { SocketStatus } from "~/hooks/useGameSocket";

const DOT: Record<SocketStatus, string> = {
  idle: "bg-text-muted",
  connecting: "bg-warning",
  open: "bg-success",
  closed: "bg-danger",
};

const LABEL: Record<SocketStatus, string> = {
  idle: "Idle",
  connecting: "Connecting",
  open: "Live",
  closed: "Reconnecting",
};

export interface PlayHeaderProps {
  status: SocketStatus;
  worldTitle: string;
  characterName: string;
  onBack: () => void;
  onOpenMap: () => void;
  onOpenConsole: () => void;
}

export function PlayHeader({
  status,
  worldTitle,
  characterName,
  onBack,
  onOpenMap,
  onOpenConsole,
}: PlayHeaderProps) {
  return (
    <header className="relative flex shrink-0 items-center gap-3 border-b border-hairline px-3 py-2.5">
      <BackButton onPress={onBack} label="Back" />

      <div className="flex min-w-0 flex-1 flex-col items-center text-center">
        <h1 className="max-w-full truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-text-primary">
          {worldTitle.length === 0 ? "Chronicle" : worldTitle}
        </h1>
        <p className="flex max-w-full items-center gap-1.5 truncate text-[0.6875rem] text-text-muted">
          <Tooltip content={LABEL[status]}>
            <span
              role="img"
              aria-label={LABEL[status]}
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[status]}`}
            />
          </Tooltip>
          {characterName.length === 0 ? LABEL[status] : characterName}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Tooltip content="Story map">
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenMap}
            aria-label="Open the story map"
            className="text-text-accent hover:border-primary/50"
          >
            <HugeiconsIcon icon={HierarchyIcon} size={16} strokeWidth={1.5} />
          </Button>
        </Tooltip>
        <Tooltip content="Director's console">
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenConsole}
            aria-label="Open director console"
            className="text-accent hover:border-accent/50"
          >
            <HugeiconsIcon icon={PreferenceHorizontalIcon} size={16} strokeWidth={1.5} />
          </Button>
        </Tooltip>
      </div>
    </header>
  );
}
