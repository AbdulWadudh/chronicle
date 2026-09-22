export const ICON_TONES = {
  amber: "#d97706",
  rose: "#e11d48",
  teal: "#0d9488",
  violet: "#7c3aed",
  sky: "#0284c7",
  cyan: "#0891b2",
  indigo: "#4f46e5",
  emerald: "#059669",
  slate: "#475569",
  fuchsia: "#c026d3",
  orange: "#ea580c",
  pink: "#db2777",
  lime: "#65a30d",
  red: "#dc2626",
} as const;

export type IconTone = keyof typeof ICON_TONES;
