import { Collapsible } from "@base-ui/react/collapsible";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { iconToneStyle } from "~/lib/iconTone";

export interface GroupMeta {
  title: string;
  blurb: string;
  icon: IconSvgElement;
}

export interface SettingsGroupProps {
  meta: GroupMeta;
  index: number;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function SettingsGroup({
  meta,
  index,
  defaultOpen = true,
  open,
  onOpenChange,
  children,
}: SettingsGroupProps) {
  const controlled = open === undefined ? {} : { open, onOpenChange };
  return (
    <Collapsible.Root
      {...(open === undefined ? { defaultOpen } : controlled)}
      style={{ ["--rise-index" as string]: index }}
      className="raise rise-in shrink-0 overflow-hidden rounded-card border-(length:--border-width-card) border-hairline bg-card"
    >
      <Collapsible.Trigger className="group flex w-full cursor-pointer items-start gap-3 border-b border-hairline bg-raised px-4 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-hairline bg-raised text-text-accent">
          <HugeiconsIcon
            icon={meta.icon}
            size={17}
            strokeWidth={1.5}
            style={iconToneStyle(meta.icon)}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9375rem] font-semibold tracking-[-0.015em] text-text-primary">
            {meta.title}
          </span>
          <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-text-muted">
            {meta.blurb}
          </span>
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={17}
          strokeWidth={1.8}
          className="mt-1 shrink-0 text-text-muted transition-transform duration-200 group-data-panel-open:rotate-180 motion-reduce:transition-none"
        />
      </Collapsible.Trigger>

      <Collapsible.Panel className="settings-panel">
        <div className="flex flex-col gap-2 p-3">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
