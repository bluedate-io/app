import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { parseAdminUsersExportQuery } from "@/validations/adminUsers.validation";

export async function GET(req: NextRequest) {
  try {
    requireAdminId(req);
    const query = parseAdminUsersExportQuery(req.nextUrl.searchParams);
    const result = await container.adminUsersService.exportUsers(query);
    return new NextResponse(result.csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
