import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export async function GET(req: NextRequest) {
  try {
    requireAdminId(req);
    return container.adminCollegeDomainController.getAll();
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdminId(req);
    return container.adminCollegeDomainController.create(req);
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
