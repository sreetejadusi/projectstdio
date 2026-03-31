import type { ActivityEvent } from "@/lib/activity/activityTracker";

function hasStorage() {
  return typeof window !== "undefined";
}

export function getActivityQueueKey(userId: string, problemId: string) {
  return `activity-${userId}-${problemId}`;
}

export function getSubmissionSessionKey(userId: string, problemId: string) {
  return `activity-session-${userId}-${problemId}`;
}

export function loadActivityQueue(userId: string, problemId: string): ActivityEvent[] {
  if (!hasStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(getActivityQueueKey(userId, problemId));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ActivityEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[Activity] failed to load queue", error);
    return [];
  }
}

export function saveActivityQueue(
  userId: string,
  problemId: string,
  queue: ActivityEvent[],
) {
  if (!hasStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      getActivityQueueKey(userId, problemId),
      JSON.stringify(queue),
    );
  } catch (error) {
    console.error("[Activity] failed to save queue", error);
  }
}

export function clearActivityQueue(userId: string, problemId: string) {
  if (!hasStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(getActivityQueueKey(userId, problemId));
  } catch (error) {
    console.error("[Activity] failed to clear queue", error);
  }
}

export function loadSubmissionSessionId(userId: string, problemId: string) {
  if (!hasStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(getSubmissionSessionKey(userId, problemId));
  } catch (error) {
    console.error("[Activity] failed to load submission session", error);
    return null;
  }
}

export function saveSubmissionSessionId(
  userId: string,
  problemId: string,
  submissionId: string,
) {
  if (!hasStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      getSubmissionSessionKey(userId, problemId),
      submissionId,
    );
  } catch (error) {
    console.error("[Activity] failed to save submission session", error);
  }
}

export function clearSubmissionSessionId(userId: string, problemId: string) {
  if (!hasStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(getSubmissionSessionKey(userId, problemId));
  } catch (error) {
    console.error("[Activity] failed to clear submission session", error);
  }
}
