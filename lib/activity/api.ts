import type {
  AppendActivityPayload,
  CreateSubmissionPayload,
} from "@/lib/activity/activityTracker";

const SUPABASE_FUNCTIONS_BASE = `${
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://limjdxydxlpzqwyofctz.supabase.co"
}/functions/v1`;

function functionHeaders() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    "Content-Type": "application/json",
    ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {}),
  };
}

async function postFunction<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${SUPABASE_FUNCTIONS_BASE}${path}`, {
    method: "POST",
    headers: functionHeaders(),
    body: JSON.stringify(payload),
    keepalive: true,
  });

  const data = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    throw new Error(`Function request failed (${response.status})`);
  }

  return (data ?? {}) as T;
}

export async function appendActivity(payload: AppendActivityPayload) {
  await postFunction("/append-activity", payload);
}

export async function createSubmission(payload: CreateSubmissionPayload) {
  return postFunction<Record<string, unknown>>("/create-submission", payload);
}

export function sendActivityBeacon(payload: AppendActivityPayload) {
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
    return false;
  }

  try {
    return navigator.sendBeacon(
      `${SUPABASE_FUNCTIONS_BASE}/append-activity`,
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );
  } catch (error) {
    console.error("[Activity] beacon failed", error);
    return false;
  }
}
