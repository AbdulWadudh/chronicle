import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import { AdminScreen } from "./AdminScreen";
import { ADMIN_TILES } from "./tiles";

export { Runtime } from "./Runtime";

export function Admin() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  return (
    <AdminScreen
      title="Admin"
      blurb="Operator controls for this installation. Changes here affect every session, not just this device."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ADMIN_TILES.map((tile, index) => (
          <motion.button
            type="button"
            key={tile.href}
            disabled={!tile.ready}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
            onClick={() => void navigate(tile.href)}
            className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border-[length:var(--border-width-card)] border-hairline bg-card px-4 py-4 text-left transition-colors duration-200 hover:border-hairline-strong hover:bg-raised-hover disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-hairline disabled:hover:bg-card motion-reduce:transition-none"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border-[length:var(--border-width-card)] border-primary/15 bg-primary/[0.06] text-text-accent/80">
              <HugeiconsIcon icon={tile.icon} size={17} strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-[0.875rem] font-semibold tracking-[-0.015em] text-text-primary">
                {tile.title}
                {tile.ready ? null : (
                  <span className="rounded-full border-[length:var(--border-width-card)] border-hairline px-1.5 py-0.5 text-[0.5625rem] font-medium tracking-[0.08em] text-text-muted uppercase">
                    Soon
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-text-muted">
                {tile.blurb}
              </span>
            </span>
            {tile.ready ? (
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={16}
                strokeWidth={1.5}
                className="mt-0.5 shrink-0 text-text-muted"
              />
            ) : null}
          </motion.button>
        ))}
      </div>
    </AdminScreen>
  );
}
