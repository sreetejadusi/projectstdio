import { AppError } from "@/lib/errors/AppError";

export function normalizePath(path: string) {
  return path.replace(/^\/+/, "").replace(/\/+/g, "/");
}

export function buildProblemBasePath(problemId: string) {
  return normalizePath(`problems/${problemId}`);
}

export function buildSubmissionBasePath(submissionId: string) {
  return normalizePath(`submissions/${submissionId}`);
}

export function assertStoragePath(path: string) {
  if (!path || path.includes("..")) {
    throw new AppError("Invalid storage path", 400, "INVALID_STORAGE_PATH");
  }
}
