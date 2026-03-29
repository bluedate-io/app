import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export async function POST(req: NextRequest) {
  try {
    const adminId = requireAdminId(req);
    return await container.adminOnboardingReminderController.send(req, adminId);
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
