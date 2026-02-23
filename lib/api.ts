import type {
  AuthResponse,
  Classroom,
  ClassroomDetail,
  ExecuteQueuedResponse,
  ExecuteResultResponse,
  ProblemTestCase,
  ProblemSolveData,
  ProblemLanguage,
  RunResult,
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
  enqueueExecution: (language: ProblemLanguage, code: string, testcases: ProblemTestCase[]) =>
    fetchJSON<ApiSuccess<ExecuteQueuedResponse>>("/execute", {
      method: "POST",
      body: JSON.stringify({
        language,
        code,
        testcases: testcases.map((testcase) => ({
          input: testcase.input,
          expectedOutput: testcase.expectedOutput,
        })),
      }),
    }).then((res) => res.data),
  getExecutionResult: (executionId: string) =>
    fetchJSON<ApiSuccess<ExecuteResultResponse>>(`/result/${executionId}`).then((res) => res.data),
  runCodeWithPolling: async (
    language: ProblemLanguage,
    code: string,
    testcases: ProblemTestCase[],
    options?: {
      pollIntervalMs?: number;
      maxPollAttempts?: number;
      onUpdate?: (state: ExecuteResultResponse) => void;
    },
  ): Promise<RunResult> => {
    const pollIntervalMs = options?.pollIntervalMs ?? 2000;
    const maxPollAttempts = options?.maxPollAttempts ?? 30;
    console.info("[run] enqueue started", { language, testcaseCount: testcases.length });
    const queued = await api.enqueueExecution(language, code, testcases);
    console.info("[run] enqueue completed", queued);
    options?.onUpdate?.({
      executionId: queued.executionId,
      language,
      status: queued.status,
    });

    for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
      console.info("[run] polling result", { executionId: queued.executionId, attempt: attempt + 1 });
      let result: ExecuteResultResponse;
      try {
        result = await api.getExecutionResult(queued.executionId);
      } catch (error) {
        console.warn("[run] polling request failed, preserving last known progress", {
          executionId: queued.executionId,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : "unknown_error",
        });
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        continue;
      }
      options?.onUpdate?.(result);
      if (result.status === "completed" || result.status === "failed") {
        console.info("[run] execution finished", {
          executionId: result.executionId,
          status: result.status,
          verdict: result.result?.status,
        });
        return {
          executionId: result.executionId,
          status: result.status,
          language: result.language,
          createdAt: result.createdAt,
          result: result.result,
          tests: [],
        };
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Execution polling timed out");
  },
};
