import { useEffect, useState } from "react";

const STAGES = ["The scene is forming", "Light finds the edges", "The last details settle"];

const DOT_GRID = {
  backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1.4px)",
  backgroundSize: "11px 11px",
} as const;

const TICK_MS = 1000;

export interface ScenePaintingProps {
  over: boolean;
  percent: number | null;
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

export function ScenePainting({ over, percent }: ScenePaintingProps) {
  const seconds = useElapsedSeconds();

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${over ? "bg-scrim/60 backdrop-blur-[3px]" : ""}`}
    >
      <div aria-hidden="true" className="absolute inset-0 text-text-muted/15" style={DOT_GRID} />
      <div
        aria-hidden="true"
        className="dot-bloom absolute inset-0 text-primary"
        style={DOT_GRID}
      />
      <div
        aria-hidden="true"
        className="dot-bloom dot-bloom-offset absolute inset-0 text-primary"
        style={DOT_GRID}
      />

      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-canvas/75 to-transparent" />

      <span className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-center">
        {STAGES.map((stage) => (
          <span
            key={stage}
            className="stage-line absolute text-[0.75rem] tracking-[0.08em] text-text-secondary italic"
          >
            {stage}…
          </span>
        ))}
      </span>

      <span className="absolute right-3 bottom-3 rounded-control bg-card/80 px-2 py-0.5 text-[0.6875rem] tabular-nums text-text-accent backdrop-blur-sm">
        {percent === null ? `${seconds}s` : `${percent}%`}
      </span>
    </div>
  );
}
