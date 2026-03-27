import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    requireAdminId(req);
    return await container.adminUsersController.getById(req, params);
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
