import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  return NextResponse.json({
    id: params.id,
    name: params.id === "alpha" ? "Algorithms 301" : "Classroom",
    role: params.id === "alpha" ? "instructor" : "student",
    problems: [
      {
        id: "problem-1",
        title: "Two Sum Variants",
        difficulty: "easy",
        prompt: "Find indices of two numbers adding to target.",
        language: "python",
      },
      {
        id: "problem-2",
        title: "Binary Tree Depth",
        difficulty: "medium",
        prompt: "Compute max depth of a binary tree.",
        language: "java",
      },
    ],
    students: [
      {
        id: "student-1",
        name: "Jordan Lee",
        email: "jordan@campus.edu",
        status: "active",
      },
      {
        id: "student-2",
        name: "Riley Chen",
        email: "riley@campus.edu",
        status: "invited",
      },
    ],
  });
}
