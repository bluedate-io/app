// POST /api/onboarding/photos  — multipart/form-data upload
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.uploadPhoto(req, ctx),
);
