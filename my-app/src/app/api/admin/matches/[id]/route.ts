import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdminId(req);
    return await container.adminMatchesController.remove(req, params);
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
