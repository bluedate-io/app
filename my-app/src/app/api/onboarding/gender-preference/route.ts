// POST /api/onboarding/gender-preference — save only "who to meet" (no genderIdentity required)
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.saveGenderPreference(req, ctx),
);
