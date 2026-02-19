import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { AppError } from "@/lib/errors/AppError";
import type { RequestContext, UserRole } from "@/lib/types";

export async function getRequestContext(): Promise<RequestContext> {
  const headerStore = await headers();
  const requestId = headerStore.get("x-request-id") ?? randomUUID();
  const userId = headerStore.get("x-user-id") ?? undefined;
  const userRole = (headerStore.get("x-user-role") as UserRole | null) ?? undefined;
  const organizationId = headerStore.get("x-user-organization-id") ?? undefined;
  const ipAddress = headerStore.get("x-forwarded-for") ?? undefined;
  const userAgent = headerStore.get("user-agent") ?? undefined;

  return {
    requestId,
    userId,
    userRole,
    organizationId,
    ipAddress,
    userAgent,
  };
}

export function requireAuthenticatedUser(context: RequestContext) {
  if (!context.userId || !context.userRole) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return {
    userId: context.userId,
    userRole: context.userRole,
    organizationId: context.organizationId,
  };
}
