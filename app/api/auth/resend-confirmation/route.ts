import { authService } from "@/lib/services/auth.service";
import { mailService } from "@/lib/services/mail.service";
import { resendConfirmationSchema } from "@/lib/validators/auth.validator";
import { createEmailVerificationToken } from "@/lib/utils/emailTokens";
import { getAppBaseUrl } from "@/lib/utils/url";
import { getRequestContext } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "POST /api/auth/resend-confirmation";

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    const body = resendConfirmationSchema.parse(await request.json());
    const result = await authService.resendConfirmation(body);

    if (result.sent && result.userId) {
      const token = await createEmailVerificationToken(result.userId, result.email);
      const verifyUrl = `${getAppBaseUrl()}/api/auth/confirm?token=${encodeURIComponent(token)}`;
      await mailService.sendVerificationEmail(result.email, verifyUrl);
    }

    return successResponse({ sent: true }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
