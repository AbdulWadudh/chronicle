import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import type { GroupMeta } from "./fields";

export interface SettingsGroupProps {
  meta: GroupMeta;
  index: number;
  children: ReactNode;
}

export function SettingsGroup({ meta, index, children }: SettingsGroupProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.05, ease: "easeOut" }}
      className="overflow-hidden rounded-[20px] border border-hairline bg-card/50"
    >
      <header className="flex items-start gap-3 border-b border-hairline bg-raised px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-primary/15 bg-primary/[0.06] text-text-accent/80">
          <HugeiconsIcon icon={meta.icon} size={17} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-text-primary">
            {meta.title}
          </h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">{meta.blurb}</p>
        </div>
      </header>

      <div className="flex flex-col gap-2 p-3">{children}</div>
    </motion.section>
  );
}
