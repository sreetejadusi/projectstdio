import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors/AppError";
import type { AuthTokenPayload, UserRole } from "@/lib/types";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function signSessionToken(params: {
  userId: string;
  role: UserRole;
  sessionId: string;
  organizationId?: string;
}) {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    role: params.role,
    organizationId: params.organizationId,
    sessionId: params.sessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(params.userId)
    .setIssuedAt(now)
    .setExpirationTime(now + env.JWT_EXPIRES_IN_SECONDS)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<AuthTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role;
    const sessionId = payload.sessionId;

    if (
      typeof payload.sub !== "string" ||
      (role !== "student" && role !== "instructor" && role !== "admin") ||
      typeof sessionId !== "string"
    ) {
      throw new AppError("Invalid session token", 401, "INVALID_TOKEN");
    }

    return {
      sub: payload.sub,
      role,
      sessionId,
      organizationId:
        typeof payload.organizationId === "string" ? payload.organizationId : undefined,
      iat: typeof payload.iat === "number" ? payload.iat : 0,
      exp: typeof payload.exp === "number" ? payload.exp : 0,
    };
  } catch {
    throw new AppError("Invalid or expired session token", 401, "INVALID_TOKEN");
  }
}
