import { FullScreenIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";

export interface FullScreenSceneButtonProps {
  busy: boolean;
  onEnter: () => void;
}

export function FullScreenSceneButton({ busy, onEnter }: FullScreenSceneButtonProps) {
  return (
    <Tooltip content="Watch full screen">
      <Button
        variant="outline"
        size="icon"
        disabled={busy}
        aria-label="Watch this scene full screen"
        onClick={onEnter}
        className="absolute right-2 bottom-2 border-hairline-strong bg-transparent text-text-accent hover:border-primary/50 hover:bg-card/40"
      >
        <HugeiconsIcon icon={FullScreenIcon} size={16} strokeWidth={2} />
      </Button>
    </Tooltip>
  );
}
