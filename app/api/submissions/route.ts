import { submissionService } from "@/lib/services/submission.service";
import { createSubmissionSchema } from "@/lib/validators/submission.validator";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const POST_ENDPOINT = "POST /api/submissions";
const GET_ENDPOINT = "GET /api/submissions";

export async function GET(request: Request) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get("problemId");

    if (!problemId) {
      throw new Error("problemId is required");
    }

    const submissions = await submissionService.listForUserProblem(auth.userId, problemId);
    return successResponse({ submissions }, context, GET_ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, GET_ENDPOINT);
  }
}

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const body = createSubmissionSchema.parse(await request.json());

    const submission = await submissionService.createSubmission(body, {
      userId: auth.userId,
    });

    return successResponse({ submission }, context, POST_ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, POST_ENDPOINT);
  }
}
