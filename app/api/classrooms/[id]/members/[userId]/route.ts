import { classroomService } from "@/lib/services/classroom.service";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "DELETE /api/classrooms/:id/members/:userId";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const { id, userId } = await params;

    const result = await classroomService.removeMember(id, userId, {
      userId: auth.userId,
    });

    return successResponse(result, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
