import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
  try {
    const authKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !authKey) {
      return NextResponse.json(
        {
          error: "Supabase server configuration is missing.",
          details: {
            hasSupabaseUrl: Boolean(SUPABASE_URL),
            hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
            hasAnonKey: Boolean(SUPABASE_ANON_KEY),
          },
        },
        { status: 500 },
      );
    }

    const payload = await request.json();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/user-discovery`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authKey}`,
        apikey: authKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to submit response to Supabase.",
          details: text,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, data: text });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }
}
