export type ActivityEvent =
  | { type: "run"; t: number; passed: number; total: number }
  | { type: "copy"; t: number }
  | { type: "paste"; t: number }
  | { type: "tab_blur"; t: number }
  | { type: "tab_focus"; t: number }
  | { type: "code_change"; t: number; chars: number };

export type AppendActivityPayload = {
  user_id: string;
  problem_id: string;
  events: ActivityEvent[];
};

export type CreateSubmissionPayload = {
  user_id: string;
  problem_id: string;
  code: string;
  language: "python" | "java" | "c";
  passed: number;
  total: number;
};

export type ActivityTrackerOptions = {
  userId: string;
  problemId: string;
};

export const ACTIVITY_BATCH_INTERVAL_MS = 30_000;
export const CODE_CHANGE_DEBOUNCE_MS = 500;
export const ACTIVITY_QUEUE_LIMIT = 100;
