// GET /api/onboarding/photos  — list photos
// POST /api/onboarding/photos  — multipart/form-data upload
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const GET = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.getPhotos(req, ctx),
);

export const POST = withAuth((req: NextRequest, ctx) =>
  container.onboardingController.uploadPhoto(req, ctx),
);
