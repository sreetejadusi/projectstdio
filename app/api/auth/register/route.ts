import { authService } from "@/lib/services/auth.service";
import { registerSchema } from "@/lib/validators/auth.validator";
import { createSessionToken, setSessionCookie } from "@/lib/utils/auth";
import { getRequestContext } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "POST /api/auth/register";

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    const body = registerSchema.parse(await request.json());

    const created = await authService.register(body);
    const authResult = await authService.createSessionForUser(
      created.userId,
      created.role,
      created.email,
      {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    );
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
