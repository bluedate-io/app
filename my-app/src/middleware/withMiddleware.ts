// ─── withMiddleware ───────────────────────────────────────────────────────────
// Composable route wrapper that runs auth + any additional guards.
// Usage in a route file:
//
//   export const GET = withAuth(async (req, ctx) => {
//     return container.userController.listUsers(req);
//   });

import { NextRequest, NextResponse } from "next/server";
import type { RequestContext } from "@/types";
import { authenticate } from "./auth.middleware";
import { handleError } from "@/utils/response";

type AuthedHandler = (
  req: NextRequest,
  ctx: RequestContext,
  params?: Record<string, string>,
) => Promise<NextResponse>;

type RouteGuard = (ctx: RequestContext) => void;

export function withAuth(handler: AuthedHandler, ...guards: RouteGuard[]) {
  return async (
    req: NextRequest,
    { params }: { params?: Promise<Record<string, string>> } = {},
  ): Promise<NextResponse> => {
    try {
      const ctx = authenticate(req);
      for (const guard of guards) guard(ctx);
      const resolvedParams = params ? await params : undefined;
      return await handler(req, ctx, resolvedParams);
    } catch (error) {
      return handleError(error);
    }
  };
}

// Public routes — no auth required, just error handling
export function withHandler(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      return handleError(error);
    }
  };
}
