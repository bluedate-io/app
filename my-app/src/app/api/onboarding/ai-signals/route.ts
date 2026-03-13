// POST /api/onboarding/ai-signals
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.saveAiSignals(req, ctx),
);
