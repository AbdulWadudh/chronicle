import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "~/components/common/ErrorBoundary";
import { Spinner } from "~/components/common/Spinner";
import { DiceResult } from "~/components/story/DiceResult";
import type { PendingDiceCheck } from "~/hooks/useTurnStream";

const DiceRoller3D = lazy(async () => {
  const module = await import("~/components/canvas/dice");
  return { default: module.DiceRoller3D };
});

const DICE_SIZE = 200;
const ENTER = { duration: 0.28, ease: "easeOut" } as const;

export interface DiceOverlayProps {
  check: PendingDiceCheck | null;
  label: string;
  onSettled: () => void;
}

export function DiceOverlay({ check, label, onSettled }: DiceOverlayProps) {
  return (
    <AnimatePresence>
      {check === null ? null : (
        <motion.div
          key={check.checkId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={ENTER}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-scrim/55 backdrop-blur-sm"
        >
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ENTER}
            className="text-[0.75rem] tracking-[0.14em] text-text-accent uppercase"
          >
            {label} · DC {check.dc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <ErrorBoundary label="the dice roller" fallback={<DiceResult {...check} />}>
              <Suspense fallback={<Spinner size={28} label="Rolling" />}>
                <DiceRoller3D roll={check.roll} size={DICE_SIZE} onSettled={onSettled} />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
