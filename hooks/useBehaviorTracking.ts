"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTelemetry } from "@/components/providers/TelemetryProvider";

export function useBehaviorTracking() {
  const telemetry = useTelemetry();
  const pathname = usePathname();
  const startRef = useRef<number>(0);
  const runsRef = useRef(0);
  const failuresRef = useRef(0);

  useEffect(() => {
    const startedAt = Date.now();
    startRef.current = startedAt;

    const handleFocus = () => {
      telemetry.track({
        type: "tab_focus",
        ts: Date.now(),
        page: pathname,
      });
    };

    const handleBlur = () => {
      telemetry.track({
        type: "tab_blur",
        ts: Date.now(),
        page: pathname,
      });
    };

    const handleVisibility = () => {
      telemetry.track({
        type: document.visibilityState === "hidden" ? "tab_hidden" : "tab_visible",
        ts: Date.now(),
        page: pathname,
      });
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    telemetry.track({
      type: "page_enter",
      ts: Date.now(),
      page: pathname,
    });

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);

      const durationMs = Date.now() - startedAt;
      telemetry.track({
        type: "page_exit",
        ts: Date.now(),
        page: pathname,
        payload: { durationMs },
      });
    };
  }, [pathname, telemetry]);

  return useMemo(
    () => ({
      recordRun: () => {
        runsRef.current += 1;
        telemetry.track({
          type: "run",
          ts: Date.now(),
          page: pathname,
          payload: { count: runsRef.current },
        });
      },
      recordTestFailure: (count: number) => {
        failuresRef.current += count;
        telemetry.track({
          type: "test_failures",
          ts: Date.now(),
          page: pathname,
          payload: { count: failuresRef.current, added: count },
        });
      },
      recordKeystroke: (timestamp: number) => {
        telemetry.track({
          type: "keystroke",
          ts: Date.now(),
          page: pathname,
          payload: { timestamp },
        });
      },
      recordPasteAttempt: () => {
        telemetry.track({
          type: "paste_attempt",
          ts: Date.now(),
          page: pathname,
        });
      },
      recordContentChange: (length: number) => {
        telemetry.track({
          type: "content_change",
          ts: Date.now(),
          page: pathname,
          payload: { length },
        });
      },
    }),
    [pathname, telemetry],
  );
}
