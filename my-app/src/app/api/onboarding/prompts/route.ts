// GET/POST /api/onboarding/prompts
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const GET = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.getPrompts(req, ctx),
);

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.savePrompts(req, ctx),
);

