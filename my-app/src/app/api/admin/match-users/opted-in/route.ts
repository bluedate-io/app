import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { parseAdminMatchUsersPageQuery } from "@/validations/adminMatchUsers.validation";

export async function GET(req: NextRequest) {
  try {
    requireAdminId(req);
    const query = parseAdminMatchUsersPageQuery(req.nextUrl.searchParams);
    const data = await container.adminMatchUsersService.getOptedInUsers(query);
    return NextResponse.json({ data });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
