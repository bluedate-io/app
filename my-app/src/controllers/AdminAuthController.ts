// ─── AdminAuthController — `/api/admin/auth/*`

import { NextRequest, NextResponse } from "next/server";
import type { AdminAuthService } from "@/services/AdminAuthService";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  async sendOtp(req: NextRequest) {
    try {
      const { email } = await req.json();
      const data = await this.adminAuthService.sendOtp(email);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }

  async verifyOtp(req: NextRequest) {
    try {
      const { email, code } = await req.json();
      const data = await this.adminAuthService.verifyOtp(email, code);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }
}
