import { NextResponse } from "next/server";
import type { RequestContext } from "@/lib/types";
import { logger } from "@/lib/utils/logger";

export function successResponse<T>(data: T, context: RequestContext, endpoint: string) {
  logger.info({
    requestId: context.requestId,
    userId: context.userId,
    endpoint,
    statusCode: 200,
    message: "Request successful",
  });

  return NextResponse.json({
    success: true,
    data,
  });
}
