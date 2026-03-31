import { submissionService } from "@/lib/services/submission.service";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const GET_ENDPOINT = "GET /api/submissions/:id";
const DELETE_ENDPOINT = "DELETE /api/submissions/:id";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const { id } = await params;
    const submission = await submissionService.getSubmissionForUser(auth.userId, id);
    return successResponse({ submission }, context, GET_ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, GET_ENDPOINT);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const { id } = await params;
    const result = await submissionService.deleteSubmissionForUser(auth.userId, id);
    return successResponse(result, context, DELETE_ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, DELETE_ENDPOINT);
  }
}
