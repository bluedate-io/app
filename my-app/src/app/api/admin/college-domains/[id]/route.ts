import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdminId(req);
    const { id } = await params;
    return container.adminCollegeDomainController.update(req, id);
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdminId(req);
    const { id } = await params;
    return container.adminCollegeDomainController.deleteOne(req, id);
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
