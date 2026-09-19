import type { TurnNode } from "@chronicle/shared";

export const NODE_WIDTH = 168;
export const NODE_HEIGHT = 84;
export const COLUMN_GAP = 120;
export const ROW_GAP = 28;

export type NodeState = "active" | "success" | "failure" | "default";

export interface PlacedNode {
  id: string;
  parentId: string | null;
  x: number;
  y: number;
  label: string;
  state: NodeState;
}

export interface FlowchartGraph {
  nodes: PlacedNode[];
  width: number;
  height: number;
}

function depthOf(turn: TurnNode, byId: Map<string, TurnNode>): number {
  let depth = 0;
  let cursor = turn.parentId;
  const seen = new Set<string>();
  while (cursor !== null && !seen.has(cursor)) {
    seen.add(cursor);
    depth += 1;
    cursor = byId.get(cursor)?.parentId ?? null;
  }
  return depth;
}

function stateOf(turn: TurnNode, activeId: string | null): NodeState {
  if (turn.id === activeId) return "active";
  if (turn.diceCheck === null) return "default";
  return turn.diceCheck.succeeded === false ? "failure" : "success";
}

export function layoutGraph(turns: readonly TurnNode[], activeId: string | null): FlowchartGraph {
  const byId = new Map(turns.map((turn) => [turn.id, turn]));
  const rowsPerColumn = new Map<number, number>();
  const nodes: PlacedNode[] = [];

  for (const turn of turns) {
    const column = depthOf(turn, byId);
    const row = rowsPerColumn.get(column) ?? 0;
    rowsPerColumn.set(column, row + 1);
    nodes.push({
      id: turn.id,
      parentId: turn.parentId,
      x: column * (NODE_WIDTH + COLUMN_GAP),
      y: row * (NODE_HEIGHT + ROW_GAP),
      label: turn.playerAction,
      state: stateOf(turn, activeId),
    });
  }

  const width = nodes.reduce((max, node) => Math.max(max, node.x + NODE_WIDTH), NODE_WIDTH);
  const height = nodes.reduce((max, node) => Math.max(max, node.y + NODE_HEIGHT), NODE_HEIGHT);
  return { nodes, width, height };
}

export interface Edge {
  id: string;
  from: PlacedNode;
  to: PlacedNode;
  failed: boolean;
}

export function edgesOf(graph: FlowchartGraph): Edge[] {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const edges: Edge[] = [];
  for (const node of graph.nodes) {
    if (node.parentId === null) continue;
    const parent = byId.get(node.parentId);
    if (parent === undefined) continue;
    edges.push({
      id: `${parent.id}->${node.id}`,
      from: parent,
      to: node,
      failed: node.state === "failure",
    });
  }
  return edges;
}

export function splinePath(edge: Edge): string {
  const startX = edge.from.x + NODE_WIDTH;
  const startY = edge.from.y + NODE_HEIGHT / 2;
  const endX = edge.to.x;
  const endY = edge.to.y + NODE_HEIGHT / 2;
  const midX = startX + (endX - startX) / 2;
  return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
}
