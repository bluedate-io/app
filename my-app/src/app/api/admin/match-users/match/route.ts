import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { parseAdminMatchUsersCreateBody } from "@/validations/adminMatchUsers.validation";

export async function POST(req: NextRequest) {
  try {
    const adminId = requireAdminId(req);
    const body = parseAdminMatchUsersCreateBody(await req.json());
    const data = await container.adminMatchUsersService.createMatch(adminId, body);
    return NextResponse.json({ data });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
