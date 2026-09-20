import { AnimatePresence, motion } from "motion/react";
import { GlowBackdrop } from "~/components/common/GlowBackdrop";
import { type ScenePalette, useScenePalette } from "~/hooks/useScenePalette";

const FADE = { duration: 1.4, ease: "easeOut" } as const;

const ORBS = ["118vw 100vw at 72% 22%", "98vw 90vw at 6% 86%", "76vw 68vw at 92% 66%"] as const;

export interface SceneBackdropProps {
  imageUrl: string | null;
}

function washOf(palette: ScenePalette): string {
  const [top, bottom, accent] = ORBS;
  return [
    `radial-gradient(${top}, ${palette.top}, transparent 68%)`,
    `radial-gradient(${bottom}, ${palette.bottom}, transparent 66%)`,
    `radial-gradient(${accent}, ${palette.accent}, transparent 70%)`,
  ].join(", ");
}

export function SceneBackdrop({ imageUrl }: SceneBackdropProps) {
  const palette = useScenePalette(imageUrl);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <GlowBackdrop />

      <AnimatePresence>
        {palette === null ? null : (
          <motion.div
            key={`${palette.top}${palette.bottom}${palette.accent}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            style={{ backgroundImage: washOf(palette) }}
            className="scene-drift absolute inset-0"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
