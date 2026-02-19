import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  return NextResponse.json({
    id: params.id,
    title: "Two Sum Variants",
    difficulty: "easy",
    prompt: "Return indices of two numbers that add up to a target.",
    language: "python",
  });
}
