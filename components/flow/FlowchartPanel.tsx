"use client";

import { memo, useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Handle,
  MarkerType,
  Panel,
  Position,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";
import type { FlowchartData } from "@/lib/types";
import "reactflow/dist/style.css";

type Props = {
  data: FlowchartData | null;
};

type FlowNodeData = {
  label: string;
  status: "neutral" | "matched";
  isHovered: boolean;
  onHoverStart: (nodeId: string) => void;
  onHoverEnd: () => void;
};

function FlowchartControls() {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  return (
    <Panel position="top-right">
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-900/40 bg-slate-950/85 p-2 shadow-[0_18px_40px_rgba(3,7,18,0.45)] backdrop-blur">
        <button
          type="button"
          onClick={() => zoomOut()}
          className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-800/60 bg-slate-900 text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-500/15"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => fitView({ duration: 300, padding: 0.2 })}
          className="rounded-xl border border-emerald-800/60 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-500/15"
        >
          Fit
        </button>
        <button
          type="button"
          onClick={() => zoomIn()}
          className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-800/60 bg-slate-900 text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-500/15"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
    </Panel>
  );
}

const FlowNode = memo(({ data, id }: NodeProps<FlowNodeData>) => {
  return (
    <div
      onMouseEnter={() => data.onHoverStart(id)}
      onMouseLeave={data.onHoverEnd}
      className={`min-w-48 rounded-[22px] border px-4 py-3 shadow-[0_18px_36px_rgba(3,7,18,0.28)] backdrop-blur transition duration-150 ${
        data.isHovered
          ? "border-emerald-300 bg-gradient-to-br from-emerald-100 via-white to-emerald-50 shadow-[0_0_0_3px_rgba(74,222,128,0.22),0_22px_44px_rgba(16,185,129,0.18)]"
          : data.status === "matched"
          ? "border-emerald-400/80 bg-gradient-to-br from-emerald-100 via-white to-emerald-50"
          : "border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50/60"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border !border-emerald-500 !bg-white"
      />
      <div className="text-center text-sm font-semibold tracking-[0.01em] text-slate-900">
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border !border-emerald-500 !bg-white"
      />
    </div>
  );
});

FlowNode.displayName = "FlowNode";

const nodeTypes = { flowNode: FlowNode };

function buildTidyPositions(data: FlowchartData): Record<string, { x: number; y: number }> {
  const sortedByY = [...data.nodes].sort((a, b) => a.y - b.y || a.x - b.x);
  const rowThreshold = 80;
  const rowAssignments = new Map<string, number>();
  const rows: Array<{ anchorY: number; ids: string[] }> = [];

  for (const node of sortedByY) {
    if (rows.length === 0) {
      rows.push({ anchorY: node.y, ids: [node.id] });
      rowAssignments.set(node.id, 0);
      continue;
    }

    const lastRow = rows[rows.length - 1];
    if (Math.abs(node.y - lastRow.anchorY) <= rowThreshold) {
      lastRow.ids.push(node.id);
      rowAssignments.set(node.id, rows.length - 1);
      continue;
    }

    rows.push({ anchorY: node.y, ids: [node.id] });
    rowAssignments.set(node.id, rows.length - 1);
  }

  if (rows.length <= 1 && data.edges.length > 0) {
    const incomingCount = new Map<string, number>();
    const outgoing = new Map<string, string[]>();

    for (const node of data.nodes) {
      incomingCount.set(node.id, 0);
      outgoing.set(node.id, []);
    }

    for (const edge of data.edges) {
      if (!incomingCount.has(edge.target) || !outgoing.has(edge.source)) continue;
      incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
      outgoing.get(edge.source)?.push(edge.target);
    }

    const depths = new Map<string, number>();
    const queue: string[] = [];
    for (const node of data.nodes) {
      if ((incomingCount.get(node.id) ?? 0) === 0) {
        depths.set(node.id, 0);
        queue.push(node.id);
      }
    }
    if (queue.length === 0 && data.nodes.length > 0) {
      queue.push(data.nodes[0].id);
      depths.set(data.nodes[0].id, 0);
    }

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const currentDepth = depths.get(current) ?? 0;
      for (const target of outgoing.get(current) ?? []) {
        const nextDepth = currentDepth + 1;
        if ((depths.get(target) ?? -1) < nextDepth) {
          depths.set(target, nextDepth);
          queue.push(target);
        }
      }
    }

    const depthRows = new Map<number, string[]>();
    for (const node of data.nodes) {
      const depth = depths.get(node.id) ?? 0;
      if (!depthRows.has(depth)) depthRows.set(depth, []);
      depthRows.get(depth)?.push(node.id);
    }

    rows.length = 0;
    const sortedDepths = [...depthRows.keys()].sort((a, b) => a - b);
    for (const depth of sortedDepths) {
      rows.push({ anchorY: depth, ids: depthRows.get(depth) ?? [] });
    }
    rowAssignments.clear();
    rows.forEach((row, rowIndex) => {
      row.ids.forEach((id) => rowAssignments.set(id, rowIndex));
    });
  }

  const xSpacing = 240;
  const ySpacing = 140;
  const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
  const positions: Record<string, { x: number; y: number }> = {};

  rows.forEach((row, rowIndex) => {
    const ordered = [...row.ids].sort((a, b) => {
      const nodeA = nodeById.get(a);
      const nodeB = nodeById.get(b);
      if (!nodeA || !nodeB) return 0;
      return nodeA.x - nodeB.x || nodeA.label.localeCompare(nodeB.label);
    });
    const half = (ordered.length - 1) / 2;
    ordered.forEach((id, index) => {
      positions[id] = {
        x: (index - half) * xSpacing,
        y: rowIndex * ySpacing,
      };
    });
  });

  for (const node of data.nodes) {
    if (!positions[node.id]) {
      positions[node.id] = { x: node.x, y: node.y };
    }
  }

  return positions;
}

export function FlowchartPanel({ data }: Props) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const handleHoverStart = useCallback((nodeId: string) => {
    setHoveredNodeId(nodeId);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const tidyPositions = useMemo(() => (data ? buildTidyPositions(data) : {}), [data]);

  const nodes = useMemo<Node[]>(() => {
    if (!data) return [];

    return data.nodes.map((node) => ({
      id: node.id,
      type: "flowNode",
      position: tidyPositions[node.id] ?? { x: node.x, y: node.y },
      data: {
        label: node.label,
        status: node.status,
        isHovered: hoveredNodeId === node.id,
        onHoverStart: handleHoverStart,
        onHoverEnd: handleHoverEnd,
      },
      draggable: false,
      selectable: false,
    }));
  }, [data, handleHoverEnd, handleHoverStart, hoveredNodeId, tidyPositions]);

  const edges = useMemo<Edge[]>(() => {
    if (!data) return [];

    return data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: hoveredNodeId === edge.source || hoveredNodeId === edge.target,
      selectable: false,
      style: {
        stroke:
          hoveredNodeId === edge.source || hoveredNodeId === edge.target ? "#22c55e" : "#14532d",
        strokeOpacity:
          hoveredNodeId === edge.source || hoveredNodeId === edge.target ? 1 : 0.82,
        strokeWidth:
          hoveredNodeId === edge.source || hoveredNodeId === edge.target ? 3.5 : 2.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color:
          hoveredNodeId === edge.source || hoveredNodeId === edge.target
            ? "#22c55e"
            : "#14532d",
        width: 18,
        height: 18,
      },
    }));
  }, [data, hoveredNodeId]);

  if (!data) {
    return (
      <div className="grid h-full min-h-64 place-items-center rounded-[28px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] text-sm text-[color:var(--text-secondary)]">
        <p>No flowchart available yet.</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-64 overflow-hidden rounded-[28px] border border-emerald-900/15 bg-[radial-gradient(circle_at_20%_15%,rgba(74,222,128,0.22),transparent_28%),radial-gradient(circle_at_82%_82%,rgba(16,185,129,0.16),transparent_24%),linear-gradient(180deg,#f7fef9_0%,#ebfff2_100%)] dark:border-emerald-400/15 dark:bg-[radial-gradient(circle_at_20%_15%,rgba(34,197,94,0.18),transparent_28%),radial-gradient(circle_at_82%_82%,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,#07130d_0%,#0b1911_100%)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        minZoom={0.4}
        maxZoom={1.8}
      >
        <FlowchartControls />
        <Background color="rgba(20, 83, 45, 0.18)" gap={24} size={1.2} />
      </ReactFlow>
    </div>
  );
}
