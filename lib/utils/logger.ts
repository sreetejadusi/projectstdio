import { env } from "@/lib/env";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  statusCode?: number;
  errorCode?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
};

function write(level: LogLevel, payload: LogPayload) {
  const output = {
    level,
    ts: new Date().toISOString(),
    ...payload,
    ...(env.NODE_ENV === "production" ? { stack: undefined } : { stack: payload.stack }),
  };

  const serialized = JSON.stringify(output);
  if (level === "error" || level === "warn") {
    console.error(serialized);
    return;
  }
  console.log(serialized);
}

export const logger = {
  debug: (payload: LogPayload) => write("debug", payload),
  info: (payload: LogPayload) => write("info", payload),
  warn: (payload: LogPayload) => write("warn", payload),
  error: (payload: LogPayload) => write("error", payload),
};
