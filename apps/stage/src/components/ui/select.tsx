import { Combobox } from "@base-ui/react/combobox";
import { ArrowDown01Icon, Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
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

interface OptionGroup {
  value: string;
  items: string[];
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
  const items = useMemo<OptionGroup[]>(
    () => groups.map((group) => ({ value: group.label ?? "", items: [...group.values] })),
    [groups],
  );

  const total = useMemo(
    () => groups.reduce((count, group) => count + group.values.length, 0),
    [groups],
  );

  return (
    <Combobox.Root
      items={items}
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange(next);
      }}
    >
      <Combobox.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        data-slot="select-trigger"
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-control border-(length:--border-width-card) border-card-border bg-input-surface px-3.5 py-2.5 text-left text-[0.8125rem] text-text-primary outline-none transition-colors hover:border-hairline-strong focus-visible:border-primary/60 data-popup-open:border-primary/60 motion-reduce:transition-none",
          mono && "font-mono text-[0.75rem]",
        )}
      >
        <span className="truncate">
          <Combobox.Value placeholder={placeholder} />
        </span>
        <Combobox.Icon className="shrink-0 text-text-muted">
          <HugeiconsIcon icon={ArrowDown01Icon} size={15} strokeWidth={1.5} />
        </Combobox.Icon>
      </Combobox.Trigger>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="z-50 outline-none">
          <Combobox.Popup
            data-slot="select-content"
            className="flex max-h-[min(22rem,var(--available-height))] w-(--anchor-width) min-w-55 origin-(--transform-origin) flex-col overflow-hidden rounded-control border-(length:--border-width-card) border-hairline text-text-primary shadow-(--shadow-overlay) transition-[opacity,transform] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            <div className="relative shrink-0 border-b border-hairline p-2">
              <HugeiconsIcon
                icon={Search01Icon}
                size={14}
                strokeWidth={1.5}
                className="pointer-events-none absolute top-1/2 left-4.5 -translate-y-1/2 text-text-muted"
              />
              <Combobox.Input
                placeholder={`Filter ${total} options`}
                aria-label={`Filter ${ariaLabel}`}
                className="w-full rounded-control border-(length:--border-width-card) border-hairline bg-sunken py-2 pr-2.5 pl-8 text-[0.75rem] text-text-primary outline-none placeholder:text-text-muted focus-visible:border-primary/60"
              />
            </div>

            <Combobox.Empty className="px-3 py-4 text-center text-[0.75rem] text-text-muted empty:hidden">
              Nothing matches that.
            </Combobox.Empty>

            <Combobox.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
              {(group: OptionGroup) => (
                <Combobox.Group key={group.value} items={group.items} className="block">
                  {group.value === "" ? null : (
                    <Combobox.GroupLabel className="px-2 py-1.5 text-[0.625rem] font-medium tracking-[0.12em] text-text-muted uppercase">
                      {group.value}
                    </Combobox.GroupLabel>
                  )}
                  <Combobox.Collection>
                    {(option: string) => (
                      <Combobox.Item
                        key={option}
                        value={option}
                        className="relative flex cursor-pointer items-center gap-2 rounded-control py-2 pr-2 pl-8 text-[0.8125rem] outline-none select-none data-highlighted:bg-sunken data-selected:text-text-accent"
                      >
                        <Combobox.ItemIndicator className="absolute left-2 flex size-4 items-center justify-center">
                          <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2} />
                        </Combobox.ItemIndicator>
                        <span className={mono ? "font-mono text-[0.75rem]" : undefined}>
                          {option}
                        </span>
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

export { Select };
