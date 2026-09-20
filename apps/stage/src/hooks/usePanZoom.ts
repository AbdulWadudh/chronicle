import {
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useRef,
  useState,
} from "react";

const WHEEL_SENSITIVITY = 0.0015;

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface PanZoomOptions {
  minScale: number;
  maxScale: number;
  offset?: number;
  clamp?: (viewport: Viewport) => Viewport;
}

interface Point {
  x: number;
  y: number;
}

function clampScale(value: number, options: PanZoomOptions): number {
  return Math.min(Math.max(value, options.minScale), options.maxScale);
}

function localPoint(element: HTMLElement, clientX: number, clientY: number): Point {
  const bounds = element.getBoundingClientRect();
  return { x: clientX - bounds.left, y: clientY - bounds.top };
}

export interface PanZoom {
  viewport: Viewport;
  zoomBy: (factor: number, focus: Point) => void;
  reset: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onWheel: (event: ReactWheelEvent<HTMLElement>) => void;
}

export function usePanZoom(options: PanZoomOptions): PanZoom {
  const origin = options.offset ?? 0;
  const [viewport, setViewport] = useState<Viewport>({ x: origin, y: origin, scale: 1 });
  const pointers = useRef(new Map<number, Point>());
  const pinchSpread = useRef<number | null>(null);

  const zoomAt = useCallback(
    (factor: number, focus: Point) => {
      setViewport((current) => {
        const scale = clampScale(current.scale * factor, options);
        const ratio = scale / current.scale;
        const next = {
          scale,
          x: focus.x - (focus.x - current.x) * ratio,
          y: focus.y - (focus.y - current.y) * ratio,
        };
        return options.clamp === undefined ? next : options.clamp(next);
      });
    },
    [options],
  );

  const reset = useCallback(() => {
    setViewport({ x: origin, y: origin, scale: 1 });
  }, [origin]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    pointers.current.set(
      event.pointerId,
      localPoint(event.currentTarget, event.clientX, event.clientY),
    );
    pinchSpread.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
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

      setViewport((current) => {
        const panned = {
          ...current,
          x: current.x + (next.x - previous.x),
          y: current.y + (next.y - previous.y),
        };
        return options.clamp === undefined ? panned : options.clamp(panned);
      });
    },
    [zoomAt, options],
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

  return { viewport, zoomBy: zoomAt, reset, onPointerDown, onPointerMove, onPointerUp, onWheel };
}
