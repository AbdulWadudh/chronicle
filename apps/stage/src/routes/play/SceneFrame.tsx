import { PaintBrush01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { PreviewableImage } from "~/components/common/PreviewableImage";
import { ScenePainting } from "./ScenePainting";

const ARRIVAL = { duration: 0.55, ease: "easeOut" } as const;
const DISSOLVE = { duration: 1.4, ease: "easeInOut" } as const;
const MORPH = { layout: { type: "spring", stiffness: 150, damping: 26 } } as const;

export interface SceneFrameProps {
  imageUrl: string | null;
  alt: string;
  aspect: number;
  painting: boolean;
  percent: number | null;
  actions?: ReactNode;
  corner?: ReactNode;
  layoutId?: string;
  animateLayout?: boolean;
  drift?: boolean;
}

function Badge({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <span
      className={`flex items-center gap-2 rounded-control border-(length:--border-width-card) px-3 py-1.5 text-[0.75rem] shadow-(--shadow-overlay) backdrop-blur-sm ${
        muted === true
          ? "border-hairline bg-card/85 text-text-muted"
          : "border-primary/30 bg-card/85 text-text-accent"
      }`}
    >
      {children}
    </span>
  );
}

export function SceneFrame({
  imageUrl,
  alt,
  aspect,
  painting,
  percent,
  actions,
  corner,
  layoutId,
  animateLayout = false,
  drift = false,
}: SceneFrameProps) {
  const blank = imageUrl === null;

  return (
    <motion.div
      layout={animateLayout}
      layoutId={layoutId}
      transition={MORPH}
      style={{ aspectRatio: aspect }}
      className="group relative w-full overflow-hidden rounded-card border-(length:--border-width-card) border-card-border bg-secondary shadow-(--shadow-overlay)"
    >
      <div
        className={`absolute inset-0 bg-linear-to-br from-secondary via-raised to-secondary ${
          blank && painting ? "animate-pulse" : ""
        }`}
      />

      <AnimatePresence initial={false}>
        {blank ? null : (
          <motion.div
            key={imageUrl}
            initial={drift ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={drift ? DISSOLVE : ARRIVAL}
            className="absolute inset-0"
          >
            <PreviewableImage
              imageUrl={imageUrl}
              alt={alt}
              downloadName={alt}
              className={`absolute inset-0 h-full w-full rounded-none border-0 ${drift ? "stage-drift" : ""}`}
              imageClassName="h-full w-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {painting ? (
          <ScenePainting key="painting" over={!blank} percent={percent} veil={drift} />
        ) : null}
      </AnimatePresence>

      {blank && !painting ? (
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <Badge muted>
            <HugeiconsIcon icon={PaintBrush01Icon} size={14} strokeWidth={1.75} />
            No scene for this moment yet
          </Badge>
        </div>
      ) : null}

      {actions === undefined ? null : (
        <div
          className={`absolute top-2 right-2 flex items-center gap-1.5 transition-opacity duration-150 motion-reduce:transition-none ${
            blank && !painting
              ? "opacity-100"
              : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
          }`}
        >
          {actions}
        </div>
      )}

      {corner === undefined || blank ? null : corner}
    </motion.div>
  );
}
