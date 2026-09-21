import type { TurnNode } from "@chronicle/utils";
import { MusicNote01Icon, RefreshIcon, VolumeHighIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";

export type RegenerateTarget = "narrative" | "audio";

export interface TurnActionsProps {
  turn: TurnNode;
  busy: boolean;
  onReplayAudio: (turn: TurnNode) => void;
  onRegenerate: (turnId: string, target: RegenerateTarget) => void;
  canRewrite: boolean;
}

const TONE = {
  success: "text-success hover:border-success/50 hover:bg-success/10",
  accent: "text-accent hover:border-accent/50 hover:bg-accent/10",
  warning: "text-warning hover:border-warning/50 hover:bg-warning/10",
} as const;

interface ActionProps {
  icon: IconSvgElement;
  label: string;
  tone: keyof typeof TONE;
  disabled: boolean;
  onPress: () => void;
}

function Action({ icon, label, tone, disabled, onPress }: ActionProps) {
  return (
    <Tooltip content={label}>
      <Button
        variant="outline"
        size="icon"
        onClick={onPress}
        disabled={disabled}
        aria-label={label}
        className={TONE[tone]}
      >
        <HugeiconsIcon icon={icon} size={15} strokeWidth={2} />
      </Button>
    </Tooltip>
  );
}

export function TurnActions({
  turn,
  busy,
  onReplayAudio,
  onRegenerate,
  canRewrite,
}: TurnActionsProps) {
  const hasAudio = turn.audioUrls.length > 0;

  return (
    <div className="flex items-center gap-2 self-end opacity-70 transition-opacity duration-150 focus-within:opacity-100 hover:opacity-100 motion-reduce:transition-none">
      <Action
        icon={VolumeHighIcon}
        label={hasAudio ? "Play the narration" : "No narration audio yet"}
        tone="success"
        disabled={busy || !hasAudio}
        onPress={() => onReplayAudio(turn)}
      />
      <Action
        icon={MusicNote01Icon}
        label="Voice this turn again"
        tone="warning"
        disabled={busy}
        onPress={() => onRegenerate(turn.id, "audio")}
      />
      {canRewrite ? (
        <Action
          icon={RefreshIcon}
          label="Write this turn again"
          tone="accent"
          disabled={busy}
          onPress={() => onRegenerate(turn.id, "narrative")}
        />
      ) : null}
    </div>
  );
}
