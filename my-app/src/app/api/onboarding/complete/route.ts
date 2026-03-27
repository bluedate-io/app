// POST /api/onboarding/complete  — marks onboarding as finished + returns fresh JWT
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const POST = withAuth((req: NextRequest, ctx) => container.onboardingController.complete(req, ctx));
