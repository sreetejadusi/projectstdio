import { classroomService } from "@/lib/services/classroom.service";
import { assignProblemSchema } from "@/lib/validators/classroom.validator";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "POST /api/classrooms/:id/problems";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const body = assignProblemSchema.parse(await request.json());
    const { id } = await params;

    const assignment = await classroomService.assignProblem(id, body, {
      userId: auth.userId,
    });

    return successResponse({ assignment }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
