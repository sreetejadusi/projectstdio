import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    nodes: [
      { id: "n1", label: "Start", status: "neutral", x: 0, y: 0 },
      { id: "n2", label: "Loop", status: "matched", x: 200, y: 0 },
      { id: "n3", label: "Check", status: "neutral", x: 200, y: 140 },
      { id: "n4", label: "Return", status: "neutral", x: 0, y: 140 },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
    ],
  });
}
