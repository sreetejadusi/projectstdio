import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/utils/session";
import { verifySessionToken } from "@/lib/utils/jwt";

const PILOT_USER_ID = "a7580a03-6c68-46f9-a505-b409a8410d6e";
const PILOT_USER_ROLE = "student";

const PUBLIC_API_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/confirm",
  "/api/auth/resend-confirmation",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId = requestHeaders.get("x-request-id") ?? crypto.randomUUID();
  requestHeaders.set("x-request-id", requestId);

  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isPublicApi = pathname.startsWith("/api") && PUBLIC_API_PATHS.has(pathname);
  const isVisualizationRoute = pathname === "/visualize";
  const isProtectedApi = (pathname.startsWith("/api") && !isPublicApi) || isVisualizationRoute;

  if (!token) {
    if (isProtectedApi) {
      requestHeaders.set("x-user-id", PILOT_USER_ID);
      requestHeaders.set("x-user-role", PILOT_USER_ROLE);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  try {
    const payload = await verifySessionToken(token);
    requestHeaders.set("x-user-id", payload.sub);
    requestHeaders.set("x-user-role", payload.role);
    requestHeaders.set("x-session-id", payload.sessionId);
    if (payload.organizationId) {
      requestHeaders.set("x-user-organization-id", payload.organizationId);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    if (isProtectedApi) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired session token",
          },
        },
        { status: 401 },
      );
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
}

export const config = {
  matcher: ["/api/:path*", "/visualize"],
};
