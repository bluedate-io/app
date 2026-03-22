// POST /api/onboarding/complete  — marks onboarding as finished + returns fresh JWT
import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";
import { handleError } from "@/utils/response";

export const POST = withAuth(async (_req: NextRequest, ctx) => {
  try {
    await container.onboardingService.completeOnboarding(ctx.userId);

    // Issue a fresh token with onboardingCompleted: true so the proxy unblocks
    const { accessToken, expiresIn } = container.authService.issueToken(
      ctx.userId,
      ctx.phone,
      ctx.email,
      ctx.role,
      true,
    );

    return NextResponse.json({
      success: true,
      data: { accessToken, expiresIn },
      message: "Onboarding complete! Welcome to bluedate.",
    });
  } catch (error) {
    return handleError(error);
  }
});
