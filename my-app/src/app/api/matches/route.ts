// ─── /api/matches ─────────────────────────────────────────────────────────────
//  POST /api/matches  → swipe on a user

import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";
import { swipeSchema } from "@/validations/match.validation";
import { successResponse, handleError } from "@/utils/response";

export const POST = withAuth(async (req: NextRequest, ctx) => {
  try {
    const body = await req.json();
    const input = swipeSchema.parse(body);
    const result = await container.matchmakingService.swipe(ctx.userId, input);
    return successResponse(result, {
      message: result.matched ? "It's a match!" : "Swipe recorded",
    });
  } catch (error) {
    return handleError(error);
  }
});
