"use client";

import { memo, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
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
};

const FlowNode = memo(({ data }: NodeProps<FlowNodeData>) => {
  return (
    <div
      className={`min-w-44 rounded-2xl border px-4 py-3 shadow-[0_14px_28px_rgba(105,83,55,0.12)] backdrop-blur ${
        data.isHovered
          ? "border-amber-300 bg-gradient-to-b from-amber-200/90 to-orange-200/80 shadow-[0_0_0_2px_rgba(251,191,36,0.35),0_18px_34px_rgba(105,83,55,0.18)]"
          : data.status === "matched"
            ? "border-emerald-300/70 bg-gradient-to-b from-emerald-100/90 to-emerald-50/90"
            : "border-[color:var(--border)] bg-gradient-to-b from-white/95 to-[#fff7eb]/95"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border !border-amber-300 !bg-amber-400"
      />
      <div className="text-center text-xs font-semibold tracking-wide text-[color:var(--text-primary)]">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border !border-amber-300 !bg-amber-400"
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
      },
      draggable: false,
      selectable: false,
    }));
  }, [data, hoveredNodeId, tidyPositions]);

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
          hoveredNodeId === edge.source || hoveredNodeId === edge.target ? "#f59e0b" : "#fbbf24",
        strokeOpacity: hoveredNodeId ? 0.9 : 0.7,
        strokeWidth: hoveredNodeId === edge.source || hoveredNodeId === edge.target ? 3 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: hoveredNodeId === edge.source || hoveredNodeId === edge.target ? "#f59e0b" : "#fbbf24",
        width: 18,
        height: 18,
      },
    }));
  }, [data, hoveredNodeId]);

  if (!data) {
    return (
      <div className="grid h-full min-h-64 place-items-center rounded-2xl border border-dashed border-[color:var(--border)] bg-[#fff7eb] text-sm text-[color:var(--text-secondary)]">
        <p>No flowchart available yet.</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-64 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.18),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(244,114,182,0.12),transparent_45%),linear-gradient(180deg,#fffdfa,#fff4e5)]">
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
        onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        onPaneMouseLeave={() => setHoveredNodeId(null)}
      >
        <Controls
          showInteractive={false}
          className="[&>button]:!h-8 [&>button]:!w-8 [&>button]:!border-[color:var(--border)] [&>button]:!bg-white [&>button]:!text-[color:var(--text-primary)] [&>button:hover]:!bg-[#fff7eb]"
        />
        <Background color="rgba(217, 119, 6, 0.18)" gap={22} size={1} />
      </ReactFlow>
    </div>
  );
}
