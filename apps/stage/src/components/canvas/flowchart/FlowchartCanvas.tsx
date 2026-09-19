import type { TurnNode } from "@chronicle/shared";
import type { CanvasKit, Surface } from "canvaskit-wasm";
import { useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "~/components/common/Spinner";
import { useThemeTokens } from "~/theme/ThemeEngine";
import { loadCanvasKit } from "./canvaskit";
import { drawGraph } from "./draw";
import { edgesOf, layoutGraph, NODE_HEIGHT, NODE_WIDTH } from "./layout";
import { usePanZoom } from "./usePanZoom";

const LABEL_LIMIT = 64;

export interface FlowchartCanvasProps {
  turns: readonly TurnNode[];
  activeTurnId: string | null;
  width: number;
  height: number;
}

export function FlowchartCanvas({ turns, activeTurnId, width, height }: FlowchartCanvasProps) {
  const tokens = useThemeTokens();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<Surface | null>(null);
  const [kit, setKit] = useState<CanvasKit | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const { viewport, ...gestures } = usePanZoom();

  const graph = useMemo(() => layoutGraph(turns, activeTurnId), [turns, activeTurnId]);
  const edges = useMemo(() => edgesOf(graph), [graph]);

  useEffect(() => {
    let cancelled = false;
    loadCanvasKit().then(
      (loaded) => {
        if (!cancelled) setKit(loaded);
      },
      (error: unknown) => {
        if (!cancelled) setFailure(error instanceof Error ? error.message : "CanvasKit failed.");
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const element = canvasRef.current;
    if (kit === null || element === null || width <= 0 || height <= 0) return;

    const ratio = window.devicePixelRatio;
    element.width = Math.round(width * ratio);
    element.height = Math.round(height * ratio);

    const surface = kit.MakeWebGLCanvasSurface(element);
    if (surface === null) {
      setFailure("This browser could not create a WebGL surface for the story map.");
      return;
    }
    surfaceRef.current = surface;

    return () => {
      surfaceRef.current = null;
      surface.delete();
    };
  }, [kit, width, height]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (kit === null || surface === null) return;
    const ratio = window.devicePixelRatio;
    const canvas = surface.getCanvas();
    canvas.save();
    canvas.scale(ratio, ratio);
    drawGraph(kit, canvas, graph, edges, tokens, viewport);
    canvas.restore();
    surface.flush();
  }, [kit, graph, edges, tokens, viewport]);

  const overlayTransform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`;

  if (failure !== null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-center text-[0.8125rem] text-danger">{failure}</p>
      </div>
    );
  }

  return (
    <div
      {...gestures}
      style={{ width, height, touchAction: "none" }}
      className="relative cursor-grab overflow-hidden rounded-[var(--radius-card)] bg-canvas active:cursor-grabbing"
    >
      <canvas ref={canvasRef} style={{ width, height }} className="block" />

      {kit === null ? (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted">
          <Spinner label="Loading the story map" />
        </div>
      ) : null}

      <ul
        aria-label="Story map"
        className="pointer-events-none absolute inset-0 m-0 list-none p-0"
        style={{ transform: overlayTransform, transformOrigin: "0 0" }}
      >
        {graph.nodes.map((node) => (
          <li
            key={node.id}
            aria-current={node.state === "active" ? "true" : undefined}
            className="absolute flex flex-col justify-center gap-1 overflow-hidden px-3"
            style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
          >
            <span className="text-[0.625rem] uppercase tracking-[0.12em] text-text-muted">
              {node.state === "failure"
                ? "Failed"
                : node.state === "success"
                  ? "Succeeded"
                  : node.state === "active"
                    ? "In progress"
                    : "Turn"}
            </span>
            <span className="line-clamp-3 text-[0.75rem] leading-tight text-text-primary">
              {node.label.slice(0, LABEL_LIMIT)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
