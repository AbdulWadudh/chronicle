import type { ThemeTokens } from "@chronicle/config";
import { COLOR_SECTIONS } from "./colors";
import { FONT_ORDER } from "./fonts";
import { NUMERIC_ORDER } from "./measures";

export interface MergeSection {
  title: string;
  hint: string;
  keys: readonly (keyof ThemeTokens)[];
}

export const MERGE_SECTIONS: readonly MergeSection[] = [
  ...COLOR_SECTIONS,
  {
    title: "Shape and motion",
    hint: "Corners, borders, text scale and shadow.",
    keys: NUMERIC_ORDER,
  },
  {
    title: "Fonts",
    hint: "Interface, narrative and monospace families.",
    keys: FONT_ORDER,
  },
];

export const COLOR_SECTION_TITLES: readonly string[] = COLOR_SECTIONS.map(
  (section) => section.title,
);
