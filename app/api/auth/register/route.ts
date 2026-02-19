import { authService } from "@/lib/services/auth.service";
import { mailService } from "@/lib/services/mail.service";
import { registerSchema } from "@/lib/validators/auth.validator";
import { createEmailVerificationToken } from "@/lib/utils/emailTokens";
import { getAppBaseUrl } from "@/lib/utils/url";
import { getRequestContext } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "POST /api/auth/register";

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    const body = registerSchema.parse(await request.json());

    const created = await authService.register(body);

    const token = await createEmailVerificationToken(created.userId, created.email);
    const verifyUrl = `${getAppBaseUrl()}/api/auth/confirm?token=${encodeURIComponent(token)}`;

    await mailService.sendVerificationEmail(created.email, verifyUrl);

    return successResponse(
      {
        userId: created.userId,
        email: created.email,
        requiresEmailConfirmation: true,
      },
      context,
      ENDPOINT,
    );
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
