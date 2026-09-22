import { ICON_TONES, type IconTone } from "@chronicle/config";
import {
  Bookmark01Icon,
  ChartAverageIcon,
  DiceFaces05Icon,
  FlashIcon,
  Image01Icon,
  Image02Icon,
  Layers01Icon,
  PaintBoardIcon,
  PaintBucketIcon,
  PlayListIcon,
  PuzzleIcon,
  QuillWrite02Icon,
  RulerIcon,
  SourceCodeIcon,
  TextFontIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

const TONES = new Map<IconSvgElement, IconTone>([
  [PaintBucketIcon, "amber"],
  [PaintBoardIcon, "rose"],
  [RulerIcon, "teal"],
  [TextFontIcon, "violet"],
  [PuzzleIcon, "sky"],
  [Image01Icon, "cyan"],
  [Image02Icon, "cyan"],
  [Layers01Icon, "indigo"],
  [QuillWrite02Icon, "emerald"],
  [SourceCodeIcon, "slate"],
  [PlayListIcon, "fuchsia"],
  [ChartAverageIcon, "orange"],
  [UserMultipleIcon, "pink"],
  [Bookmark01Icon, "lime"],
  [DiceFaces05Icon, "red"],
  [FlashIcon, "orange"],
]);

export function iconToneStyle(icon: IconSvgElement | undefined): { color?: string } {
  const tone = icon === undefined ? undefined : TONES.get(icon);
  return tone === undefined ? {} : { color: ICON_TONES[tone] };
}
