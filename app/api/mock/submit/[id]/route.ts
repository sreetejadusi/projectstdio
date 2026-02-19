import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    accepted: false,
    score: 70,
    output: "Submission recorded.\n2/3 tests passed.",
    tests: [
      { id: "t1", name: "Sample 1", passed: true },
      { id: "t2", name: "Sample 2", passed: false },
      { id: "t3", name: "Edge case", passed: true },
    ],
  });
}
