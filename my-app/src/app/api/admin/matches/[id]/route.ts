import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { parseAdminMatchIdParams } from "@/validations/adminMatches.validation";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdminId(req);
    const parsed = parseAdminMatchIdParams(await params);
    const data = await container.adminMatchesService.removeMatch(parsed.id);
    return NextResponse.json({ data });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
