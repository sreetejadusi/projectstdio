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

    const blockEvent = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const handleCopy = (event: ClipboardEvent) => {
      blockEvent(event);
      enqueue({ type: "copy", t: Date.now() });
    };
    const handleCut = (event: ClipboardEvent) => {
      blockEvent(event);
      enqueue({ type: "cut", t: Date.now() });
    };
    const handlePaste = (event: ClipboardEvent) => {
      blockEvent(event);
      enqueue({ type: "paste", t: Date.now() });
    };
    const handleContextMenu = (event: MouseEvent) => {
      blockEvent(event);
      enqueue({ type: "context_menu", t: Date.now() });
    };
    const handleDrop = (event: DragEvent) => {
      blockEvent(event);
      enqueue({ type: "drop", t: Date.now() });
    };
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const withModifier = event.metaKey || event.ctrlKey;
      const withShift = event.shiftKey;

      if (event.key === "F12") {
        blockEvent(event);
        enqueue({ type: "devtools_shortcut", t: Date.now(), shortcut: "F12" });
        return;
      }

      if (withModifier && withShift && ["i", "j", "c"].includes(key)) {
        blockEvent(event);
        enqueue({
          type: "devtools_shortcut",
          t: Date.now(),
          shortcut: `${event.metaKey ? "Meta" : "Ctrl"}+Shift+${key.toUpperCase()}`,
        });
        return;
      }

      if (withModifier && ["c", "x", "v", "s", "p", "u", "a"].includes(key)) {
        blockEvent(event);
        const actions: Record<string, string> = {
          c: "copy",
          x: "cut",
          v: "paste",
          s: "save",
          p: "print",
          u: "view_source",
          a: "select_all",
        };
        enqueue({
          type: "shortcut_block",
          t: Date.now(),
          action: actions[key] ?? key,
        });
      }
    };
    const handlePageHide = () => flushWithBeacon();

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCut, true);
    document.addEventListener("paste", handlePaste, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("drop", handleDrop, true);
    document.addEventListener("dragover", handleDragOver, true);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCut, true);
      document.removeEventListener("paste", handlePaste, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("drop", handleDrop, true);
      document.removeEventListener("dragover", handleDragOver, true);
      window.removeEventListener("keydown", handleKeyDown, true);
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
      recordCut: () => enqueue({ type: "cut", t: Date.now() }),
      recordPaste: () => enqueue({ type: "paste", t: Date.now() }),
      recordTabBlur: () => enqueue({ type: "tab_blur", t: Date.now() }),
      recordTabFocus: () => enqueue({ type: "tab_focus", t: Date.now() }),
      recordContextMenu: () => enqueue({ type: "context_menu", t: Date.now() }),
      recordDrop: () => enqueue({ type: "drop", t: Date.now() }),
      recordShortcutBlock: (action: string) =>
        enqueue({ type: "shortcut_block", t: Date.now(), action }),
      recordDevtoolsShortcut: (shortcut: string) =>
        enqueue({ type: "devtools_shortcut", t: Date.now(), shortcut }),
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
