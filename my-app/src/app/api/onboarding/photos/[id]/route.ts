// DELETE /api/onboarding/photos/[id]
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const DELETE = withAuth(
  (req: NextRequest, ctx, params) =>
    container.onboardingController.deletePhoto(req, ctx, params!.id),
);
