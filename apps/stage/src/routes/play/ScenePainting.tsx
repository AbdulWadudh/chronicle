import type { ImageStage } from "@chronicle/utils";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const STAGES = ["The scene is forming", "Light finds the edges", "The last details settle"];

const STAGE_TINT: Record<ImageStage, string> = {
  sketch: "text-text-accent",
  detail: "text-success",
};

const QUEUED_TINT = "text-text-secondary";

const DOT_GRID = {
  backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1.4px)",
  backgroundSize: "11px 11px",
} as const;

const TICK_MS = 1000;
const VEIL = { duration: 0.9, ease: "easeOut" } as const;

export interface ScenePaintingProps {
  over: boolean;
  percent: number | null;
  stage?: ImageStage | null;
  preview?: string | null;
  veil?: boolean;
}

function useElapsedSeconds(): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      setSeconds(Math.floor((Date.now() - started) / TICK_MS));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return seconds;
}

function Counter({ percent, seconds }: { percent: number | null; seconds: number }) {
  return (
    <span className="absolute right-3 bottom-3 rounded-control bg-card/80 px-2 py-0.5 text-[0.6875rem] tabular-nums text-text-accent backdrop-blur-sm">
      {percent === null ? `${seconds}s` : `${percent}%`}
    </span>
  );
}

export function ScenePainting({
  over,
  percent,
  stage = null,
  preview = null,
  veil = false,
}: ScenePaintingProps) {
  const seconds = useElapsedSeconds();
  const tint = stage === null ? QUEUED_TINT : STAGE_TINT[stage];

  if (veil) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={VEIL}
        className="absolute inset-0 overflow-hidden bg-scrim"
      >
        {preview === null ? null : (
          <motion.img
            key="preview"
            src={preview}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={VEIL}
            className="absolute inset-0 h-full w-full scale-105 object-cover blur-lg"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 text-text-secondary/30"
          style={DOT_GRID}
        />
        <div aria-hidden="true" className={`dot-bloom absolute inset-0 ${tint}`} style={DOT_GRID} />
        <div
          aria-hidden="true"
          className={`dot-bloom dot-bloom-offset absolute inset-0 ${tint}`}
          style={DOT_GRID}
        />
      </motion.div>
    );
  }

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${over ? "bg-scrim/60 backdrop-blur-[3px]" : ""}`}
    >
      {preview === null ? null : (
        <motion.img
          key="preview"
          src={preview}
          alt=""
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={VEIL}
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-lg"
        />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 text-text-secondary/30"
        style={DOT_GRID}
      />
      <div aria-hidden="true" className={`dot-bloom absolute inset-0 ${tint}`} style={DOT_GRID} />
      <div
        aria-hidden="true"
        className={`dot-bloom dot-bloom-offset absolute inset-0 ${tint}`}
        style={DOT_GRID}
      />

      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-canvas/75 to-transparent" />

      <span className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-center">
        {STAGES.map((stage) => (
          <span
            key={stage}
            className="stage-line absolute rounded-control bg-card/80 px-2.5 py-1 text-[0.75rem] tracking-[0.08em] text-text-primary italic backdrop-blur-sm"
          >
            {stage}…
          </span>
        ))}
      </span>

      <Counter percent={percent} seconds={seconds} />
    </div>
  );
}
