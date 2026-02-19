import { submissionService } from "@/lib/services/submission.service";
import { createSubmissionSchema } from "@/lib/validators/submission.validator";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "POST /api/submissions";

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const body = createSubmissionSchema.parse(await request.json());

    const submission = await submissionService.createSubmission(body, {
      userId: auth.userId,
    });

    return successResponse({ submission }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
