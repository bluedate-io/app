// ─── Auth middleware ──────────────────────────────────────────────────────────
// Extracts and verifies the Bearer JWT on each request.
// Returns a RequestContext to be passed down to controllers.

import { NextRequest } from "next/server";
import { container } from "@/lib/container";
import type { RequestContext, UserRole } from "@/types";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";
import { v4 as uuidv4 } from "uuid";

function extractBearerToken(req: NextRequest): string {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }
  return authHeader.slice(7);
}

export function authenticate(req: NextRequest): RequestContext {
  const token = extractBearerToken(req);
  const payload = container.authService.verifyAccessToken(token);
  return {
    userId: payload.sub,
    phone: payload.phone,
    email: payload.email,
    role: payload.role,
    onboardingCompleted: payload.onboardingCompleted,
    requestId: uuidv4(),
  };
}

export function requireRole(...roles: UserRole[]) {
  return (ctx: RequestContext): void => {
    if (!roles.includes(ctx.role)) {
      throw new ForbiddenError(
        `This action requires one of the following roles: ${roles.join(", ")}`,
      );
    }
  };
}
