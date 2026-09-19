import type { ThemeTokens } from "@chronicle/shared";
import type { Canvas, CanvasKit, Paint } from "canvaskit-wasm";
import { type Edge, type FlowchartGraph, NODE_HEIGHT, NODE_WIDTH, splinePath } from "./layout";

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

const EDGE_WIDTH = 1.5;
const FAILED_EDGE_WIDTH = 2;
const DASH_INTERVALS = [7, 6];
const GLOW_SIGMA = 14;
const BADGE_RADIUS = 5;
const BADGE_INSET = 12;

function fill(kit: CanvasKit, color: string): Paint {
  const paint = new kit.Paint();
  paint.setAntiAlias(true);
  paint.setColor(kit.parseColorString(color));
  paint.setStyle(kit.PaintStyle.Fill);
  return paint;
}

function stroke(kit: CanvasKit, color: string, width: number): Paint {
  const paint = new kit.Paint();
  paint.setAntiAlias(true);
  paint.setColor(kit.parseColorString(color));
  paint.setStyle(kit.PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  return paint;
}

function borderColor(state: string, tokens: ThemeTokens): string {
  if (state === "active") return tokens.cardGlow;
  if (state === "success") return tokens.success;
  if (state === "failure") return tokens.danger;
  return tokens.cardBorder;
}

function drawEdges(kit: CanvasKit, canvas: Canvas, edges: readonly Edge[], tokens: ThemeTokens) {
  const plain = stroke(kit, tokens.cardBorder, EDGE_WIDTH);
  const failed = stroke(kit, tokens.danger, FAILED_EDGE_WIDTH);
  failed.setPathEffect(kit.PathEffect.MakeDash(DASH_INTERVALS, 0));

  for (const edge of edges) {
    const path = kit.Path.MakeFromSVGString(splinePath(edge));
    if (path === null) continue;
    canvas.drawPath(path, edge.failed ? failed : plain);
    path.delete();
  }

  plain.delete();
  failed.delete();
}

function drawNodes(kit: CanvasKit, canvas: Canvas, graph: FlowchartGraph, tokens: ThemeTokens) {
  const surface = fill(kit, tokens.card);
  const glow = fill(kit, tokens.cardGlow);
  glow.setMaskFilter(kit.MaskFilter.MakeBlur(kit.BlurStyle.Normal, GLOW_SIGMA, true));
  const success = fill(kit, tokens.success);
  const failure = fill(kit, tokens.danger);

  for (const node of graph.nodes) {
    const rect = kit.LTRBRect(node.x, node.y, node.x + NODE_WIDTH, node.y + NODE_HEIGHT);
    const rounded = kit.RRectXY(rect, tokens.radius, tokens.radius);

    if (node.state === "active") canvas.drawRRect(rounded, glow);
    canvas.drawRRect(rounded, surface);

    const border = stroke(kit, borderColor(node.state, tokens), tokens.borderWidth);
    canvas.drawRRect(rounded, border);
    border.delete();

    if (node.state === "success" || node.state === "failure") {
      canvas.drawCircle(
        node.x + NODE_WIDTH - BADGE_INSET,
        node.y + BADGE_INSET,
        BADGE_RADIUS,
        node.state === "success" ? success : failure,
      );
    }
  }

  surface.delete();
  glow.delete();
  success.delete();
  failure.delete();
}

export function drawGraph(
  kit: CanvasKit,
  canvas: Canvas,
  graph: FlowchartGraph,
  edges: readonly Edge[],
  tokens: ThemeTokens,
  viewport: Viewport,
): void {
  canvas.clear(kit.parseColorString(tokens.canvas));
  canvas.save();
  canvas.translate(viewport.x, viewport.y);
  canvas.scale(viewport.scale, viewport.scale);
  drawEdges(kit, canvas, edges, tokens);
  drawNodes(kit, canvas, graph, tokens);
  canvas.restore();
}
