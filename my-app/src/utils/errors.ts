import { AppError } from "@/types";
import { ErrorCode } from "@/constants/errors";

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      ErrorCode.NOT_FOUND,
      404,
    );
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, ErrorCode.UNAUTHORIZED, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, ErrorCode.FORBIDDEN, 403);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, ErrorCode.CONFLICT, 409);
    this.name = "ConflictError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.VALIDATION_ERROR, 422, details);
    this.name = "ValidationError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, ErrorCode.BAD_REQUEST, 400);
    this.name = "BadRequestError";
  }
}

export class OtpInvalidError extends AppError {
  constructor() {
    super("Invalid OTP code", ErrorCode.OTP_INVALID, 400);
    this.name = "OtpInvalidError";
  }
}

export class OtpExpiredError extends AppError {
  constructor() {
    super("OTP has expired. Please request a new one.", ErrorCode.OTP_EXPIRED, 400);
    this.name = "OtpExpiredError";
  }
}

export class OtpAlreadyUsedError extends AppError {
  constructor() {
    super("OTP has already been used.", ErrorCode.OTP_ALREADY_USED, 400);
    this.name = "OtpAlreadyUsedError";
  }
}

export class OtpSendFailedError extends AppError {
  constructor(detail?: string) {
    super(detail ?? "Failed to send OTP. Please try again.", ErrorCode.OTP_SEND_FAILED, 502);
    this.name = "OtpSendFailedError";
  }
}

export class OnboardingIncompleteError extends AppError {
  constructor() {
    super("Please complete onboarding first.", ErrorCode.ONBOARDING_INCOMPLETE, 403);
    this.name = "OnboardingIncompleteError";
  }
}
