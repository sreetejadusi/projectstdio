import { env } from "@/lib/env";

export function getAppBaseUrl() {
  return env.APP_BASE_URL.replace(/\/$/, "");
}
