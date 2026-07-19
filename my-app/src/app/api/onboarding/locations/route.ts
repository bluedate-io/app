// GET /api/onboarding/locations
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";

export async function GET(req: NextRequest) {
  return container.onboardingController.getLocations(req);
}
