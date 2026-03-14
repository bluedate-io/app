import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/types";
import { ErrorCode } from "@/constants/errors";
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ResponseMeta,
} from "@/types/api.types";

// ─── Success helpers ───────────────────────────────────────────────────────────

export function successResponse<T>(
  data: T,
  options: { message?: string; meta?: ResponseMeta; status?: number } = {},
): NextResponse<ApiSuccessResponse<T>> {
  const { message, meta, status = 200 } = options;
  return NextResponse.json({ success: true, data, message, meta }, { status });
}

export function createdResponse<T>(
  data: T,
  message?: string,
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, { message, status: 201 });
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// ─── Error helpers ────────────────────────────────────────────────────────────

export function errorResponse(
  message: string,
  code: string,
  status: number,
  details?: unknown,
  requestId?: string,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, error: { code, message, details }, requestId },
    { status },
  );
}

// ─── Smart error handler — call this in every catch block ─────────────────────

export function handleError(error: unknown, requestId?: string): NextResponse {
  console.error("[handleError]", error);

  if (error instanceof ZodError) {
    const flattened = error.flatten();
    const firstMessage =
      flattened.formErrors[0] ??
      (typeof flattened.fieldErrors === "object" &&
        Object.values(flattened.fieldErrors).flat().find(Boolean));
    return errorResponse(
      typeof firstMessage === "string" ? firstMessage : "Validation failed",
      ErrorCode.VALIDATION_ERROR,
      422,
      flattened.fieldErrors,
      requestId,
    );
  }

  if (error instanceof AppError) {
    return errorResponse(
      error.message,
      error.code,
      error.statusCode,
      error.details,
      requestId,
    );
  }

  return errorResponse(
    "An unexpected error occurred",
    ErrorCode.INTERNAL_SERVER_ERROR,
    500,
    undefined,
    requestId,
  );
}
