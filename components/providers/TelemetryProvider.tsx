"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { TelemetryQueue } from "@/lib/telemetry";

const TelemetryContext = createContext<TelemetryQueue | null>(null);

export function TelemetryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const beaconUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "/api/mock";

  const queue = useMemo(
    () => new TelemetryQueue(8000, `${beaconUrl}/telemetry`),
    [beaconUrl],
  );

  useEffect(() => {
    queue.start();
    return () => queue.stop();
  }, [queue]);

  return (
    <TelemetryContext.Provider value={queue}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error("useTelemetry must be used within TelemetryProvider");
  }
  return ctx;
}
