import type {
  AuthResponse,
  Classroom,
  ClassroomDetail,
  ProblemSolveData,
  SubmitResult,
  TelemetryEvent,
} from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "/api";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

async function fetchJSON<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const body = (await res.json()) as {
        error?: { message?: string };
      };
      if (body.error?.message) {
        message = body.error.message;
      }
    } catch {
      // no-op
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    fetchJSON<ApiSuccess<AuthResponse>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((res) => res.data),
  signup: (name: string, email: string, password: string) =>
    fetchJSON<ApiSuccess<AuthResponse>>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName: name, email, password, role: "student" }),
    }).then((res) => res.data),
  getClassrooms: () =>
    fetchJSON<ApiSuccess<{ classrooms: Classroom[] }>>("/classrooms").then(
      (res) => res.data.classrooms,
    ),
  createClassroom: (name: string) =>
    fetchJSON<Classroom>("/classrooms", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  joinClassroom: (code: string) =>
    fetchJSON<Classroom>("/classrooms/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  getClassroom: (id: string) =>
    fetchJSON<ApiSuccess<{ classroom: ClassroomDetail }>>(`/classrooms/${id}`).then(
      (res) => res.data.classroom,
    ),
  getProblemSolveData: (
    id: string,
    options?: { classroomId?: string; language?: "c" | "java" | "python" },
  ) => {
    const search = new URLSearchParams();
    if (options?.classroomId) search.set("classroomId", options.classroomId);
    if (options?.language) search.set("language", options.language);
    const query = search.toString();
    return fetchJSON<ApiSuccess<{ problem: ProblemSolveData }>>(
      `/problems/${id}/solve${query ? `?${query}` : ""}`,
    ).then((res) => res.data.problem);
  },
  submitCode: (problemId: string, classroomId: string, language: string, code: string) =>
    fetchJSON<ApiSuccess<{ submission: SubmitResult }>>("/submissions", {
      method: "POST",
      body: JSON.stringify({ problemId, classroomId, language, code }),
    }).then((res) => res.data.submission),
  sendTelemetry: (events: TelemetryEvent[]) =>
    fetchJSON<{ ok: true }>("/telemetry", {
      method: "POST",
      body: JSON.stringify({ events }),
    }),
};
