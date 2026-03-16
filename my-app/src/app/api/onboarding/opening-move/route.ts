// POST /api/onboarding/opening-move — save the user's opening move (Date mode only)
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.saveOpeningMove(req, ctx),
);

