// ─── Global Shared Types ──────────────────────────────────────────────────────

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<Result<T>>;

// Generic Result type — eliminates throw/catch in service layers
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<E extends AppError>(error: E): Result<never, E> {
  return { success: false, error };
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── App Error ────────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin" | "moderator";

export interface JwtPayload {
  sub: string;               // userId
  phone?: string;
  email?: string;
  role: UserRole;
  onboardingCompleted: boolean;
  iat?: number;
  exp?: number;
}

// ─── Request context (passed from middleware → controller) ────────────────────

export interface RequestContext {
  userId: string;
  phone?: string;
  email?: string;
  role: UserRole;
  onboardingCompleted: boolean;
  requestId: string;
}
