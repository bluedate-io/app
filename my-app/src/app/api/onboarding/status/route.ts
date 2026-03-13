// GET /api/onboarding/status  — returns completion status for each step
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const GET = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.getStatus(req, ctx),
);
