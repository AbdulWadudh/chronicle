import type { ComposeMode } from "@chronicle/utils";
import { MagicWand01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Spinner } from "~/components/common/Spinner";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";

export interface FieldActionsProps {
  label: string;
  busyMode: ComposeMode | null;
  canEnhance: boolean;
  disabled?: boolean;
  onCompose: (mode: ComposeMode) => void;
}

interface ActionProps {
  icon: IconSvgElement;
  tip: string;
  ariaLabel: string;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}

function Action({ icon, tip, ariaLabel, busy, disabled, onPress }: ActionProps) {
  return (
    <Tooltip content={tip}>
      <Button
        variant="outline"
        size="iconSm"
        onClick={onPress}
        disabled={disabled || busy}
        aria-label={ariaLabel}
        aria-busy={busy}
        className="border-primary/30 bg-raised-hover text-text-accent hover:border-primary/60 hover:text-text-accent"
      >
        {busy ? (
          <Spinner size={12} label={ariaLabel} />
        ) : (
          <HugeiconsIcon icon={icon} size={13} strokeWidth={1.75} />
        )}
      </Button>
    </Tooltip>
  );
}

export function FieldActions({
  label,
  busyMode,
  canEnhance,
  disabled = false,
  onCompose,
}: FieldActionsProps) {
  const anyBusy = busyMode !== null;

  return (
    <span className="flex shrink-0 items-center gap-1">
      <Action
        icon={SparklesIcon}
        tip={`Generate a ${label}`}
        ariaLabel={`Generate the ${label}`}
        busy={busyMode === "generate"}
        disabled={disabled || anyBusy}
        onPress={() => onCompose("generate")}
      />
      <Action
        icon={MagicWand01Icon}
        tip={canEnhance ? `Enhance this ${label}` : `Write a ${label} first`}
        ariaLabel={`Enhance the ${label}`}
        busy={busyMode === "enhance"}
        disabled={disabled || anyBusy || !canEnhance}
        onPress={() => onCompose("enhance")}
      />
    </span>
  );
}
