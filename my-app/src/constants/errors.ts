// ─── Canonical error codes ────────────────────────────────────────────────────
// These are the machine-readable codes returned in ApiErrorResponse.error.code

export const ErrorCode = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",

  // Resource
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",

  // Server
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // Domain
  MATCH_NOT_ELIGIBLE: "MATCH_NOT_ELIGIBLE",
  PROFILE_INCOMPLETE: "PROFILE_INCOMPLETE",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
