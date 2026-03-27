// ─── AdminAuthController — `/api/admin/auth/*`

import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import type { AdminAuthService } from "@/services/AdminAuthService";
import type { TwilioService } from "@/services/TwilioService";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export class AdminAuthController {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly adminAuthService: AdminAuthService,
  ) {}

  async sendOtp(req: NextRequest) {
    try {
      const { phone } = await req.json();

      if (!phone || phone.replace(/\D/g, "") !== config.admin.phone) {
        return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 403 });
      }

      await this.twilioService.sendVerification(`+91${config.admin.phone}`);
      return NextResponse.json({ data: { message: "OTP sent", expiresInMinutes: 10 } });
    } catch {
      return NextResponse.json({ error: { message: "Failed to send OTP" } }, { status: 500 });
    }
  }

  async verifyOtp(req: NextRequest) {
    try {
      const { phone, code } = await req.json();
      const data = await this.adminAuthService.verifyOtp(phone, code);
      return NextResponse.json({ data });
    } catch (e) {
      return adminRouteErrorResponse(e);
    }
  }
}
