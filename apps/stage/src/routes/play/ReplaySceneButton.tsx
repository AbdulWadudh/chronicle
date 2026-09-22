import type { TurnNode } from "@chronicle/utils";
import { PlayCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";

export interface ReplaySceneButtonProps {
  turn: TurnNode;
  busy: boolean;
  onReplay: (turn: TurnNode) => void;
}

export function ReplaySceneButton({ turn, busy, onReplay }: ReplaySceneButtonProps) {
  return (
    <Tooltip content="Replay this scene">
      <Button
        variant="outline"
        size="icon"
        disabled={busy}
        aria-label="Replay this scene"
        onClick={() => onReplay(turn)}
        className="absolute right-2 bottom-2 border-hairline-strong bg-transparent text-text-accent hover:border-primary/50 hover:bg-card/40"
      >
        <HugeiconsIcon icon={PlayCircleIcon} size={16} strokeWidth={2} />
      </Button>
    </Tooltip>
  );
}
