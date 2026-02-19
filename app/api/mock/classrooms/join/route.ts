import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string };
  return NextResponse.json({
    id: `join_${Date.now()}`,
    name: "Joined Classroom",
    code: body.code ?? "CL-JOIN",
    role: "student",
    studentsCount: 26,
    problemsCount: 3,
  });
}
