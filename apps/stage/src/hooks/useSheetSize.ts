import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useState } from "react";

const DOCKED = { min: 360, max: 860, fallback: 480 };
const STACKED = { min: 280, max: 900, fallback: 560 };

export interface SheetSize {
  size: number;
  onResizeStart: (event: ReactPointerEvent<HTMLElement>) => void;
}

function storageKeyFor(key: string, docked: boolean): string {
  return `chronicle.sheet.${key}.${docked ? "width" : "height"}`;
}

function readStored(key: string, fallback: number): number {
  const stored = window.localStorage.getItem(key);
  if (stored === null) return fallback;
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useSheetSize(key: string, docked: boolean): SheetSize {
  const bounds = docked ? DOCKED : STACKED;
  const [size, setSize] = useState(bounds.fallback);

  useEffect(() => {
    setSize(readStored(storageKeyFor(key, docked), bounds.fallback));
  }, [key, docked, bounds.fallback]);

  const onResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      const startPointer = docked ? event.clientX : event.clientY;
      const startSize = size;

      const onMove = (move: PointerEvent): void => {
        const travelled = docked ? startPointer - move.clientX : startPointer - move.clientY;
        const next = Math.min(Math.max(startSize + travelled, bounds.min), bounds.max);
        setSize(next);
      };

      const onUp = (): void => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setSize((settled) => {
          window.localStorage.setItem(storageKeyFor(key, docked), String(settled));
          return settled;
        });
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [docked, key, size, bounds.min, bounds.max],
  );

  return { size, onResizeStart };
}
