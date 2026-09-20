import amethystHaze from "./palettes/amethyst-haze.json";
import arctic from "./palettes/arctic.json";
import crimsonEmber from "./palettes/crimson-ember.json";
import midnightSapphire from "./palettes/midnight-sapphire.json";
import neobrutalism from "./palettes/neobrutalism.json";
import parchment from "./palettes/parchment.json";
import roseQuartz from "./palettes/rose-quartz.json";
import solarFlare from "./palettes/solar-flare.json";
import terminal from "./palettes/terminal.json";
import verdant from "./palettes/verdant.json";

export interface PaletteDocument {
  id: string;
  name: string;
  blurb: string;
  shape: Record<string, string | number>;
  dark: Record<string, string> & { primary: string };
  light: Record<string, string> & { primary: string };
}

export const PALETTE_DOCUMENTS: readonly PaletteDocument[] = [
  neobrutalism,
  midnightSapphire,
  crimsonEmber,
  verdant,
  amethystHaze,
  solarFlare,
  arctic,
  roseQuartz,
  terminal,
  parchment,
];
