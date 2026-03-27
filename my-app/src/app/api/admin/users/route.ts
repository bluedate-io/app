import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { parseAdminUsersQuery } from "@/validations/adminUsers.validation";

export async function GET(req: NextRequest) {
  try {
    requireAdminId(req);
    const query = parseAdminUsersQuery(req.nextUrl.searchParams);
    const data = await container.adminUsersService.listUsers(query.completed);
    return NextResponse.json({ data });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
