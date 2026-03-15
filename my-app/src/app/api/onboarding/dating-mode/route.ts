// POST /api/onboarding/dating-mode — save only Date vs BFF (single concern)
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.saveDatingMode(req, ctx),
);
