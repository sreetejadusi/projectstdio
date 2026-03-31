"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ACTIVITY_BATCH_INTERVAL_MS,
  ACTIVITY_QUEUE_LIMIT,
  CODE_CHANGE_DEBOUNCE_MS,
  type ActivityEvent,
  type ActivityTrackerOptions,
} from "@/lib/activity/activityTracker";
import {
  appendActivity,
  sendActivityBeacon,
} from "@/lib/activity/api";
import {
  clearActivityQueue,
  clearSubmissionSessionId,
  loadActivityQueue,
  loadSubmissionSessionId,
  saveActivityQueue,
  saveSubmissionSessionId,
} from "@/lib/activity/storage";
import {
  enqueueActivityEvent,
  removeFlushedEvents,
} from "@/lib/activity/eventQueue";

export function useActivityTracker({
  userId,
  problemId,
}: ActivityTrackerOptions) {
  const initializedKeyRef = useRef<string | null>(null);
  const queueRef = useRef<ActivityEvent[]>([]);
  const flushInFlightRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const debouncedCharsRef = useRef<number>(0);
  const submissionIdRef = useRef<string>("");

  const trackerKey = useMemo(
    () => `${userId}:${problemId}`,
    [problemId, userId],
  );

  if (
    typeof window !== "undefined" &&
    userId &&
    problemId &&
    initializedKeyRef.current !== trackerKey
  ) {
    initializedKeyRef.current = trackerKey;
    queueRef.current = loadActivityQueue(userId, problemId);
    submissionIdRef.current =
      loadSubmissionSessionId(userId, problemId) ?? crypto.randomUUID();
    saveSubmissionSessionId(userId, problemId, submissionIdRef.current);
  }

  const persistQueue = useCallback(() => {
    if (!userId || !problemId) {
      return;
    }

    saveActivityQueue(userId, problemId, queueRef.current);
  }, [problemId, userId]);

  const flushPendingCodeChange = useCallback(() => {
    if (debounceTimerRef.current == null) {
      return;
    }

    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
    const event: ActivityEvent = {
      type: "code_change",
      t: Date.now(),
      chars: debouncedCharsRef.current,
    };
    console.log("[Activity]", event);
    queueRef.current = enqueueActivityEvent(queueRef.current, event);
    persistQueue();
  }, [persistQueue]);

  const flush = useCallback(async () => {
    flushPendingCodeChange();

    if (!userId || !problemId || flushInFlightRef.current || queueRef.current.length === 0) {
      return queueRef.current.length === 0;
    }

    flushInFlightRef.current = true;
    const snapshot = [...queueRef.current];

    try {
      await appendActivity({
        user_id: userId,
        problem_id: problemId,
        events: snapshot,
      });

      queueRef.current = removeFlushedEvents(queueRef.current, snapshot.length);
      persistQueue();
      return true;
    } catch (error) {
      console.error("[Activity] flush failed", error);
      return false;
    } finally {
      flushInFlightRef.current = false;
    }
  }, [flushPendingCodeChange, persistQueue, problemId, userId]);

  const flushWithBeacon = useCallback(() => {
    flushPendingCodeChange();

    if (!userId || !problemId || queueRef.current.length === 0) {
      return;
    }

    const sent = sendActivityBeacon({
      user_id: userId,
      problem_id: problemId,
      events: queueRef.current,
    });

    if (sent) {
      queueRef.current = [];
      clearActivityQueue(userId, problemId);
    }
  }, [flushPendingCodeChange, problemId, userId]);

  const enqueue = useCallback((event: ActivityEvent) => {
    if (!userId || !problemId) {
      return;
    }

    console.log("[Activity]", event);
    queueRef.current = enqueueActivityEvent(queueRef.current, event);
    persistQueue();

    if (queueRef.current.length > ACTIVITY_QUEUE_LIMIT) {
      void flush();
    }
  }, [flush, persistQueue, problemId, userId]);

  useEffect(() => {
    if (!userId || !problemId) {
      return;
    }

    const interval = window.setInterval(() => {
      void flush();
    }, ACTIVITY_BATCH_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        enqueue({ type: "tab_blur", t: Date.now() });
      } else {
        enqueue({ type: "tab_focus", t: Date.now() });
      }
    };

    const handleCopy = () => enqueue({ type: "copy", t: Date.now() });
    const handlePaste = () => enqueue({ type: "paste", t: Date.now() });
    const handlePageHide = () => flushWithBeacon();

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);

      if (debounceTimerRef.current != null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [enqueue, flush, flushWithBeacon, problemId, trackerKey, userId]);

  return useMemo(
    () => ({
      getSubmissionId: () => submissionIdRef.current,
      recordRun: (passed: number, total: number) =>
        enqueue({ type: "run", t: Date.now(), passed, total }),
      recordCopy: () => enqueue({ type: "copy", t: Date.now() }),
      recordPaste: () => enqueue({ type: "paste", t: Date.now() }),
      recordTabBlur: () => enqueue({ type: "tab_blur", t: Date.now() }),
      recordTabFocus: () => enqueue({ type: "tab_focus", t: Date.now() }),
      recordCodeChange: (chars: number) => {
        debouncedCharsRef.current = chars;

        if (debounceTimerRef.current != null) {
          window.clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = window.setTimeout(() => {
          debounceTimerRef.current = null;
          enqueue({
            type: "code_change",
            t: Date.now(),
            chars: debouncedCharsRef.current,
          });
        }, CODE_CHANGE_DEBOUNCE_MS);
      },
      flush,
      clearQueue: () => {
        if (!userId || !problemId) {
          return;
        }

        queueRef.current = [];
        clearActivityQueue(userId, problemId);
      },
      resetSubmissionSession: () => {
        if (!userId || !problemId) {
          submissionIdRef.current = crypto.randomUUID();
          return submissionIdRef.current;
        }

        const nextId = crypto.randomUUID();
        submissionIdRef.current = nextId;
        clearSubmissionSessionId(userId, problemId);
        saveSubmissionSessionId(userId, problemId, nextId);
        return nextId;
      },
    }),
    [enqueue, flush, problemId, userId],
  );
}
