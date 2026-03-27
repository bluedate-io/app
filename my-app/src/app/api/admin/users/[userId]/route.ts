import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { parseAdminUserDetailParams } from "@/validations/adminUsers.validation";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    requireAdminId(req);
    const parsed = parseAdminUserDetailParams(await params);
    const data = await container.adminUsersService.getUser(parsed.userId);
    return NextResponse.json({ data });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
