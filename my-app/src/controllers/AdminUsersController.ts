// ─── AdminUsersController — `/api/admin/users/*`

import { NextRequest, NextResponse } from "next/server";
import type { AdminUsersService } from "@/services/AdminUsersService";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import {
  parseAdminUserDetailParams,
  parseAdminUsersExportQuery,
  parseAdminUsersQuery,
} from "@/validations/adminUsers.validation";

export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  async list(req: NextRequest) {
    try {
      const query = parseAdminUsersQuery(req.nextUrl.searchParams);
      const data = await this.adminUsersService.listUsers(query.completed);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async getById(req: NextRequest, params: Promise<{ userId: string }>) {
    try {
      const parsed = parseAdminUserDetailParams(await params);
      const data = await this.adminUsersService.getUser(parsed.userId);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async exportCsv(req: NextRequest) {
    try {
      const query = parseAdminUsersExportQuery(req.nextUrl.searchParams);
      const result = await this.adminUsersService.exportUsers(query);
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
}
