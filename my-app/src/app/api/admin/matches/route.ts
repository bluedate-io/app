import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export async function GET(req: NextRequest) {
  try {
    requireAdminId(req);
    const data = await container.adminMatchesService.listMatches();
    return NextResponse.json({ data });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
