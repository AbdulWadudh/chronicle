import { useEffect, useState } from "react";

export const SPLIT_BREAKPOINT = 900;
export const NARRATIVE_FLEX = 0.55;
export const CANVAS_FLEX = 0.45;

export type LayoutMode = "stacked" | "split";

export interface ResponsiveLayout {
  mode: LayoutMode;
  isSplit: boolean;
  width: number;
  height: number;
  narrativeWidth: number;
  canvasWidth: number;
}

interface Viewport {
  width: number;
  height: number;
}

function readViewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [viewport, setViewport] = useState<Viewport>(readViewport);

  useEffect(() => {
    const onResize = (): void => setViewport(readViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { width, height } = viewport;
  const isSplit = width >= SPLIT_BREAKPOINT && width > height;
  return {
    mode: isSplit ? "split" : "stacked",
    isSplit,
    width,
    height,
    narrativeWidth: isSplit ? width * NARRATIVE_FLEX : width,
    canvasWidth: isSplit ? width * CANVAS_FLEX : width,
  };
}
