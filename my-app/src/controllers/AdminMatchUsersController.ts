// ─── AdminMatchUsersController — `/api/admin/match-users/*`

import { NextRequest, NextResponse } from "next/server";
import type { AdminMatchUsersService } from "@/services/AdminMatchUsersService";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import {
  parseAdminMatchUsersCreateBody,
  parseAdminMatchUsersPageQuery,
  parseAdminMatchUsersSkipBody,
  parseAdminMatchUsersSuggestionsQuery,
} from "@/validations/adminMatchUsers.validation";

export class AdminMatchUsersController {
  constructor(private readonly adminMatchUsersService: AdminMatchUsersService) {}

  async getOptedIn(req: NextRequest) {
    try {
      const query = parseAdminMatchUsersPageQuery(req.nextUrl.searchParams);
      const data = await this.adminMatchUsersService.getOptedInUsers(query);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async getSuggestions(req: NextRequest) {
    try {
      const query = parseAdminMatchUsersSuggestionsQuery(req.nextUrl.searchParams);
      const data = await this.adminMatchUsersService.getSuggestions(query.userId);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async getCandidates(req: NextRequest) {
    try {
      const data = await this.adminMatchUsersService.getCandidates();
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async postSkip(req: NextRequest, adminId: string) {
    try {
      const body = parseAdminMatchUsersSkipBody(await req.json());
      const data = await this.adminMatchUsersService.createSkip(adminId, body.userId1, body.userId2);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async postMatch(req: NextRequest, adminId: string) {
    try {
      const body = parseAdminMatchUsersCreateBody(await req.json());
      const data = await this.adminMatchUsersService.createMatch(adminId, body);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }
}
