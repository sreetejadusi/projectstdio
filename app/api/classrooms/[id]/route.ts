import { z } from "zod";
import { classroomService } from "@/lib/services/classroom.service";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "GET /api/classrooms/:id";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const parsed = paramsSchema.parse(await params);

    const classroom = await classroomService.getClassroomDetailForUser(
      auth.userId,
      parsed.id,
    );

    return successResponse({ classroom }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
