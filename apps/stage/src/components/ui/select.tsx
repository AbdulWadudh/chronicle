import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "~/lib/utils";

export interface SelectOptionGroup {
  label?: string;
  values: readonly string[];
}

export interface SelectProps {
  value: string;
  groups: readonly SelectOptionGroup[];
  onValueChange: (value: string) => void;
  id?: string;
  describedBy?: string;
  ariaLabel: string;
  mono?: boolean;
  placeholder?: string;
}

function Option({ value, mono }: { value: string; mono: boolean }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className="relative flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-2 pl-8 text-[13px] outline-none select-none data-highlighted:bg-white/[0.06] data-selected:text-text-accent"
    >
      <SelectPrimitive.ItemIndicator className="absolute left-2 flex size-4 items-center justify-center">
        <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2} />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText className={mono ? "font-mono text-[12px]" : undefined}>
        {value}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function Select({
  value,
  groups,
  onValueChange,
  id,
  describedBy,
  ariaLabel,
  mono = false,
  placeholder = "Select",
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange(next);
      }}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        data-slot="select-trigger"
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-card-border bg-input-surface px-3.5 py-2.5 text-[13px] text-text-primary outline-none transition-colors hover:border-white/15 focus-visible:border-primary/60 data-popup-open:border-primary/60 motion-reduce:transition-none",
          mono && "font-mono text-[12px]",
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="shrink-0 text-text-muted">
          <HugeiconsIcon icon={ArrowDown01Icon} size={15} strokeWidth={1.5} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={6} className="z-50 outline-none">
          <SelectPrimitive.Popup className="max-h-[min(22rem,var(--available-height))] w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-hidden rounded-xl border border-white/[0.08] bg-card text-text-primary shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7)] transition-[opacity,transform] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none">
            <SelectPrimitive.List className="max-h-[inherit] overflow-y-auto overscroll-contain p-1">
              {groups.map((group, index) =>
                group.label === undefined ? (
                  group.values.map((option) => <Option key={option} value={option} mono={mono} />)
                ) : (
                  <SelectPrimitive.Group key={group.label}>
                    <SelectPrimitive.GroupLabel
                      className={cn(
                        "px-2 py-1.5 text-[10px] font-medium tracking-[0.12em] text-text-muted uppercase",
                        index > 0 && "mt-1 border-t border-white/[0.05] pt-2.5",
                      )}
                    >
                      {group.label}
                    </SelectPrimitive.GroupLabel>
                    {group.values.map((option) => (
                      <Option key={option} value={option} mono={mono} />
                    ))}
                  </SelectPrimitive.Group>
                ),
              )}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { Select };
