import { authService } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validators/auth.validator";
import { createSessionToken, setSessionCookie } from "@/lib/utils/auth";
import { getRequestContext } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "POST /api/auth/login";

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    const body = loginSchema.parse(await request.json());

    const authResult = await authService.login(body, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    const token = await createSessionToken({
      userId: authResult.userId,
      role: authResult.role,
      sessionId: authResult.sessionId,
      organizationId: authResult.organizationId,
    });

    await setSessionCookie(token);

    return successResponse(
      {
        userId: authResult.userId,
        role: authResult.role,
        organizationId: authResult.organizationId,
      },
      { ...context, userId: authResult.userId, userRole: authResult.role },
      ENDPOINT,
    );
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
