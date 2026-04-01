// ─── AdminMatchmakingController — `/api/admin/match/*`

import { NextRequest, NextResponse } from "next/server";
import type { AdminMatchmakingService } from "@/services/AdminMatchmakingService";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import {
  parseAdminMatchCandidatesQuery,
  parseAdminMatchCreateBody,
  parseAdminMatchDeleteCardBody,
  parseAdminMatchPoolQuery,
} from "@/validations/adminMatch.validation";

export class AdminMatchmakingController {
  constructor(private readonly adminMatchmakingService: AdminMatchmakingService) {}

  async getPool(req: NextRequest) {
    try {
      const q = parseAdminMatchPoolQuery(req.nextUrl.searchParams);
      const data = await this.adminMatchmakingService.getPool(q);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async getCandidates(req: NextRequest) {
    try {
      const q = parseAdminMatchCandidatesQuery(req.nextUrl.searchParams);
      const data = await this.adminMatchmakingService.getCandidates(q);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async createMatch(req: NextRequest, adminId: string) {
    try {
      let raw: unknown;
      try {
        raw = await req.json();
      } catch {
        return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400 });
      }
      const body = parseAdminMatchCreateBody(raw);
      const data = await this.adminMatchmakingService.createMatch(adminId, body);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async uploadMatchCard(req: NextRequest, adminId: string) {
    try {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: { message: "Field 'file' must be a file" } }, { status: 400 });
      }
      const data = await this.adminMatchmakingService.uploadMatchCardImage(adminId, file);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async deleteMatchCard(req: NextRequest, adminId: string) {
    try {
      let raw: unknown;
      try {
        raw = await req.json();
      } catch {
        return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400 });
      }
      const body = parseAdminMatchDeleteCardBody(raw);
      const data = await this.adminMatchmakingService.deleteMatchCardImage(adminId, body.url);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }
}
