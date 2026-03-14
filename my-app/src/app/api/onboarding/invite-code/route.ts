// POST /api/onboarding/invite-code — validate and consume invite code
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.validateInviteCode(req, ctx),
);
