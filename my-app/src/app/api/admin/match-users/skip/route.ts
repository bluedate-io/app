import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { parseAdminMatchUsersSkipBody } from "@/validations/adminMatchUsers.validation";

export async function POST(req: NextRequest) {
  try {
    const adminId = requireAdminId(req);
    const body = parseAdminMatchUsersSkipBody(await req.json());
    const data = await container.adminMatchUsersService.createSkip(adminId, body.userId1, body.userId2);
    return NextResponse.json({ data });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
