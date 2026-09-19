import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export interface BackButtonProps {
  onPress: () => void;
  label?: string;
}

export function BackButton({ onPress, label }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label="Back"
      className={`flex h-9 items-center justify-center gap-1 rounded-full text-[13px] text-text-muted ${
        label === undefined ? "w-9" : "px-2"
      }`}
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.5} />
      {label}
    </button>
  );
}
