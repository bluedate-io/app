// POST /api/auth/verify-otp
import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { withHandler } from "@/middleware/withMiddleware";
import { protectOtpVerify } from "@/lib/arcjet";

export const POST = withHandler(async (req: NextRequest) => {
  const decision = await protectOtpVerify.protect(req);
  if (decision.isDenied()) {
    const status = decision.reason.isRateLimit() ? 429 : 403;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: decision.reason.isRateLimit()
            ? "RATE_LIMITED"
            : "FORBIDDEN",
          message: "Too many requests",
        },
      },
      { status },
    );
  }
  return container.authController.verifyOtp(req);
});
