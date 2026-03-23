import { z } from "zod";
import { AppError } from "@/lib/errors/AppError";
import { handleApiError } from "@/lib/errors/errorHandler";
import { env } from "@/lib/env";
import { successResponse } from "@/lib/utils/api";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";

const ENDPOINT = "POST /api/visualize";

const visualizeBodySchema = z.object({
  language: z.enum(["python", "c", "java"]),
  code: z.string().min(1),
  input: z.string(),
});

const visualizeResponseSchema = z.object({
  steps: z.array(
    z.object({
      event: z.string(),
      line: z.number().nullable(),
      globals: z.record(z.string(), z.unknown()),
      stack: z.array(
        z.object({
          func_name: z.string(),
          line: z.number().nullable(),
          locals: z.record(z.string(), z.unknown()),
        }),
      ),
      memory: z.record(z.string(), z.unknown()),
      stdout: z.string(),
      exception: z.union([z.string(), z.record(z.string(), z.unknown()), z.null()]),
      return: z.unknown(),
      locals: z.record(z.string(), z.unknown()),
    }),
  ),
});

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    requireAuthenticatedUser(context);
    const body = visualizeBodySchema.parse(await request.json());

    const upstreamResponse = await fetch(`${env.EXECUTION_API_URL}/visualize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = (await upstreamResponse.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    const upstreamMessage =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : null;

    if (!upstreamResponse.ok) {
      throw new AppError(
        upstreamMessage ?? "Visualization request failed",
        upstreamResponse.status,
        "VISUALIZATION_FAILED",
      );
    }

    const trace = visualizeResponseSchema.parse(payload);

    return successResponse(trace, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
