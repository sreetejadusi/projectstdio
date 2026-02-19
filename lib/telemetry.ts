import type { TelemetryEvent } from "@/lib/types";
import { api } from "@/lib/api";

export class TelemetryQueue {
  private queue: TelemetryEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;
  private readonly sessionId: string;
  private readonly beaconUrl: string;

  constructor(intervalMs = 8000, beaconUrl = "/api/mock/telemetry") {
    this.intervalMs = intervalMs;
    this.sessionId = crypto.randomUUID();
    this.beaconUrl = beaconUrl;
  }

  start() {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.intervalMs);

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.handleUnload);
      document.addEventListener("visibilitychange", this.handleVisibility);
    }
  }

  stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", this.handleUnload);
      document.removeEventListener("visibilitychange", this.handleVisibility);
    }
  }

  track(event: Omit<TelemetryEvent, "sessionId">) {
    this.queue.push({ ...event, sessionId: this.sessionId });
  }

  async flush() {
    if (this.queue.length === 0) return;
    const payload = [...this.queue];
    this.queue = [];
    try {
      await api.sendTelemetry(payload);
    } catch {
      this.queue = payload.concat(this.queue);
    }
  }

  private handleUnload = () => {
    if (this.queue.length === 0) return;
    const body = JSON.stringify({ events: this.queue });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.beaconUrl, body);
      this.queue = [];
      return;
    }
    void this.flush();
  };

  private handleVisibility = () => {
    if (document.visibilityState === "hidden") {
      void this.flush();
    }
  };
}
