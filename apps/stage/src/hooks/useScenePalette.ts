import { useEffect, useState } from "react";
import { API, directorOrigin } from "~/lib/api";
import { readToken } from "~/lib/session";

const GRID = 12;
const MIN_SATURATION = 0.22;
const MAX_SATURATION = 0.5;
const MIN_LIGHTNESS = 0.32;
const MAX_LIGHTNESS = 0.6;

export interface ScenePalette {
  top: string;
  bottom: string;
  accent: string;
}

const cache = new Map<string, ScenePalette>();

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function toHsl(r: number, g: number, b: number): Hsl {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const l = (max + min) / 2;
  const span = max - min;
  if (span === 0) return { h: 0, s: 0, l };

  const s = span / (1 - Math.abs(2 * l - 1));
  const h =
    max === red
      ? ((green - blue) / span + (green < blue ? 6 : 0)) * 60
      : max === green
        ? ((blue - red) / span + 2) * 60
        : ((red - green) / span + 4) * 60;
  return { h, s, l };
}

function css({ h, s, l }: Hsl, alpha: number): string {
  const saturation = Math.round(Math.min(Math.max(s, MIN_SATURATION), MAX_SATURATION) * 100);
  const lightness = Math.round(Math.min(Math.max(l, MIN_LIGHTNESS), MAX_LIGHTNESS) * 100);
  return `hsl(${Math.round(h)} ${saturation}% ${lightness}% / ${alpha})`;
}

function averageBand(pixels: Uint8ClampedArray, fromRow: number, toRow: number): Hsl {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let row = fromRow; row < toRow; row += 1) {
    for (let column = 0; column < GRID; column += 1) {
      const index = (row * GRID + column) * 4;
      r += pixels[index] ?? 0;
      g += pixels[index + 1] ?? 0;
      b += pixels[index + 2] ?? 0;
      count += 1;
    }
  }
  return toHsl(r / count, g / count, b / count);
}

function mostSaturated(pixels: Uint8ClampedArray): Hsl {
  let best: Hsl = { h: 0, s: 0, l: 0.5 };
  for (let index = 0; index < pixels.length; index += 4) {
    const candidate = toHsl(pixels[index] ?? 0, pixels[index + 1] ?? 0, pixels[index + 2] ?? 0);
    if (candidate.s > best.s && candidate.l > 0.15 && candidate.l < 0.85) best = candidate;
  }
  return best;
}

async function extract(imageUrl: string): Promise<ScenePalette> {
  const token = readToken();
  const proxied = `${directorOrigin()}${API.assets}?url=${encodeURIComponent(imageUrl)}`;
  const response = await fetch(proxied, {
    headers: token === null ? undefined : { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`The image server answered ${response.status}`);

  const bitmap = await createImageBitmap(await response.blob(), {
    resizeWidth: GRID,
    resizeHeight: GRID,
    resizeQuality: "low",
  });
  const canvas = new OffscreenCanvas(GRID, GRID);
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("This browser has no 2d canvas");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const { data } = context.getImageData(0, 0, GRID, GRID);
  return {
    top: css(averageBand(data, 0, GRID / 3), 0.24),
    bottom: css(averageBand(data, (GRID * 2) / 3, GRID), 0.2),
    accent: css(mostSaturated(data), 0.16),
  };
}

export function useScenePalette(imageUrl: string | null): ScenePalette | null {
  const [palette, setPalette] = useState<ScenePalette | null>(null);

  useEffect(() => {
    if (imageUrl === null) return;
    const cached = cache.get(imageUrl);
    if (cached !== undefined) {
      setPalette(cached);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const next = await extract(imageUrl);
        cache.set(imageUrl, next);
        if (!cancelled) setPalette(next);
      } catch (cause) {
        console.error("[stage] could not read the scene palette:", cause);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return palette;
}
