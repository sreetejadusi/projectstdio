import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      id: "alpha",
      name: "Algorithms 301",
      code: "CL-8H2K",
      role: "instructor",
      studentsCount: 24,
      problemsCount: 5,
    },
    {
      id: "beta",
      name: "Systems Lab",
      code: "CL-9S1M",
      role: "student",
      studentsCount: 18,
      problemsCount: 4,
    },
  ]);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string };
  return NextResponse.json({
    id: `class_${Date.now()}`,
    name: body.name ?? "New Classroom",
    code: "CL-NEW1",
    role: "instructor",
    studentsCount: 0,
    problemsCount: 0,
  });
}
