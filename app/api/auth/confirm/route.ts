import { NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { verifyEmailToken } from "@/lib/utils/emailTokens";
import { createSessionToken, setSessionCookie } from "@/lib/utils/auth";
import { getRequestContext } from "@/lib/utils/request";
import { getAppBaseUrl } from "@/lib/utils/url";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "GET /api/auth/confirm";

export async function GET(request: Request) {
  const context = await getRequestContext();

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${getAppBaseUrl()}/auth/confirmation?status=invalid`);
    }

    const payload = await verifyEmailToken(token, "email_verification");
    const user = await authService.markEmailVerified(payload.sub);

    const session = await authService.createSessionForUser(user.id, user.role, user.email, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    const sessionToken = await createSessionToken({
      userId: session.userId,
      role: session.role,
      sessionId: session.sessionId,
      organizationId: session.organizationId,
    });

    await setSessionCookie(sessionToken);

    return NextResponse.redirect(`${getAppBaseUrl()}/dashboard`);
  } catch (error) {
    const handled = handleApiError(error, context, ENDPOINT);
    if (handled.status >= 400) {
      return NextResponse.redirect(`${getAppBaseUrl()}/auth/confirmation?status=invalid`);
    }
    return handled;
  }
}
