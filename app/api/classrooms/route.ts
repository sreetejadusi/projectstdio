import { classroomService } from "@/lib/services/classroom.service";
import { createClassroomSchema } from "@/lib/validators/classroom.validator";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const GET_ENDPOINT = "GET /api/classrooms";
const POST_ENDPOINT = "POST /api/classrooms";

export async function GET() {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const classrooms = await classroomService.listForUser(auth.userId);
    return successResponse({ classrooms }, context, GET_ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, GET_ENDPOINT);
  }
}

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const body = createClassroomSchema.parse(await request.json());

    const classroom = await classroomService.createClassroom(body, {
      userId: auth.userId,
      role: auth.userRole,
    });

    return successResponse({ classroom }, context, POST_ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, POST_ENDPOINT);
  }
}
