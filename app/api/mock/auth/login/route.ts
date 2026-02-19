import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    sessionId: "session_mock",
    user: { id: "user_1", name: "User", role: "student" },
  });
}
