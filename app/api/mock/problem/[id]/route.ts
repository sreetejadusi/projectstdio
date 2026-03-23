import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return NextResponse.json({
    id,
    title: "Two Sum Variants",
    difficulty: "easy",
    prompt: "Return indices of two numbers that add up to a target.",
    language: "python",
  });
}
