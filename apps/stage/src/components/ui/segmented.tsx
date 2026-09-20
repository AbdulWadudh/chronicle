import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "~/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon: IconSvgElement;
}

export interface SegmentedProps<T extends string> {
  value: T;
  options: readonly SegmentedOption<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function Segmented<T extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
  className,
}: SegmentedProps<T>) {
  const indicator = useId();

  return (
    <RadioGroup<T>
      value={value}
      onValueChange={onValueChange}
      aria-label={ariaLabel}
      data-slot="segmented"
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-(--radius-control) border-(length:--border-width-card) border-hairline bg-sunken p-1",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Radio.Root
            key={option.value}
            value={option.value}
            className="relative flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-(--radius-control) px-3 text-[0.75rem] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {selected ? (
              <motion.span
                layoutId={indicator}
                aria-hidden="true"
                className="absolute inset-0 rounded-(--radius-control) bg-primary"
                transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.7 }}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex items-center gap-1.5 transition-colors duration-200 motion-reduce:transition-none",
                selected ? "text-primary-foreground" : "text-text-muted",
              )}
            >
              <HugeiconsIcon icon={option.icon} size={14} strokeWidth={1.8} />
              {option.label}
            </span>
          </Radio.Root>
        );
      })}
    </RadioGroup>
  );
}
