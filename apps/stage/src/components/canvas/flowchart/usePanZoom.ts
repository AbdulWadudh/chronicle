import {
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import type { Viewport } from "./draw";

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const WHEEL_SENSITIVITY = 0.0015;
const INITIAL_OFFSET = 24;

interface Point {
  x: number;
  y: number;
}

function clampScale(value: number): number {
  return Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);
}

function localPoint(element: HTMLElement, clientX: number, clientY: number): Point {
  const bounds = element.getBoundingClientRect();
  return { x: clientX - bounds.left, y: clientY - bounds.top };
}

export interface PanZoom {
  viewport: Viewport;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onWheel: (event: ReactWheelEvent<HTMLElement>) => void;
}

export function usePanZoom(): PanZoom {
  const [viewport, setViewport] = useState<Viewport>({
    x: INITIAL_OFFSET,
    y: INITIAL_OFFSET,
    scale: 1,
  });
  const pointers = useRef(new Map<number, Point>());
  const pinchSpread = useRef<number | null>(null);

  const zoomAt = useCallback((factor: number, focus: Point) => {
    setViewport((current) => {
      const scale = clampScale(current.scale * factor);
      const ratio = scale / current.scale;
      return {
        scale,
        x: focus.x - (focus.x - current.x) * ratio,
        y: focus.y - (focus.y - current.y) * ratio,
      };
    });
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(
      event.pointerId,
      localPoint(event.currentTarget, event.clientX, event.clientY),
    );
    pinchSpread.current = null;
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const previous = pointers.current.get(event.pointerId);
      if (previous === undefined) return;
      const next = localPoint(event.currentTarget, event.clientX, event.clientY);
      pointers.current.set(event.pointerId, next);

      const active = [...pointers.current.values()];
      const [first, second] = active;
      if (first !== undefined && second !== undefined) {
        const spread = Math.hypot(first.x - second.x, first.y - second.y);
        const last = pinchSpread.current;
        pinchSpread.current = spread;
        if (last !== null && last > 0) {
          zoomAt(spread / last, {
            x: (first.x + second.x) / 2,
            y: (first.y + second.y) / 2,
          });
        }
        return;
      }

      setViewport((current) => ({
        ...current,
        x: current.x + (next.x - previous.x),
        y: current.y + (next.y - previous.y),
      }));
    },
    [zoomAt],
  );

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    pointers.current.delete(event.pointerId);
    pinchSpread.current = null;
  }, []);

  const onWheel = useCallback(
    (event: ReactWheelEvent<HTMLElement>) => {
      zoomAt(
        Math.exp(-event.deltaY * WHEEL_SENSITIVITY),
        localPoint(event.currentTarget, event.clientX, event.clientY),
      );
    },
    [zoomAt],
  );

  return { viewport, onPointerDown, onPointerMove, onPointerUp, onWheel };
}
