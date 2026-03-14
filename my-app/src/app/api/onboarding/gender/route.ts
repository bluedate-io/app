// POST /api/onboarding/gender — upsert only genderIdentity for the user
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.saveGender(req, ctx),
);
