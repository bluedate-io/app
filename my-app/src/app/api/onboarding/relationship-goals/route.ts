// POST /api/onboarding/relationship-goals — save only goals (does not override gender/preferences)
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.saveRelationshipGoals(req, ctx),
);
