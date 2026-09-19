import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "~/components/ui/button";

export interface BackButtonProps {
  onPress: () => void;
  label?: string;
}

export function BackButton({ onPress, label }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size={label === undefined ? "icon" : "sm"}
      onClick={onPress}
      aria-label="Back"
      className="gap-1"
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.5} />
      {label}
    </Button>
  );
}
