// ─── AdminMatchesController — `/api/admin/matches/*`

import { NextRequest, NextResponse } from "next/server";
import type { AdminMatchesService } from "@/services/AdminMatchesService";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { parseAdminMatchIdParams } from "@/validations/adminMatches.validation";

export class AdminMatchesController {
  constructor(private readonly adminMatchesService: AdminMatchesService) {}

  async list() {
    try {
      const data = await this.adminMatchesService.listMatches();
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async remove(_req: NextRequest, params: Promise<{ id: string }>) {
    try {
      const parsed = parseAdminMatchIdParams(await params);
      const data = await this.adminMatchesService.removeMatch(parsed.id);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }
}
