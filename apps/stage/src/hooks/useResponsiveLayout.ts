import { useWindowDimensions } from "react-native";

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

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
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
