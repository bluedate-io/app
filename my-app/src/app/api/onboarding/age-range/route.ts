// POST /api/onboarding/age-range — save age range (step 5 — Date and BFF)
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.saveAgeRange(req, ctx),
);
