// ─── UserApiController — thin HTTP surface for `/api/profile`, `/api/home/opt-in`,
// `/api/optin`, `/api/date/toggle`, `/api/onboarding/phone`, `/api/auth/refresh`

import { NextRequest, NextResponse } from "next/server";
import type { RequestContext } from "@/types";
import type { UserSelfService } from "@/services/UserSelfService";
import type { AuthService } from "@/services/AuthService";
import { successResponse, handleError } from "@/utils/response";
import { parseDateToggleBody, parseHomeOptInBody, parsePhoneBody } from "@/validations/userApi.validation";

export class UserApiController {
  constructor(
    private readonly userSelfService: UserSelfService,
    private readonly authService: AuthService,
  ) {}

  async getProfile(_req: NextRequest, ctx: RequestContext) {
    try {
      const data = await this.userSelfService.getProfile(ctx.userId);
      return NextResponse.json({ data });
    } catch (error) {
      return handleError(error);
    }
  }

  async getHomeOptIn(_req: NextRequest, ctx: RequestContext) {
    try {
      const data = await this.userSelfService.getHomeOptIn(ctx.userId);
      return successResponse(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async postHomeOptIn(req: NextRequest, ctx: RequestContext) {
    try {
      const body = await req.json().catch(() => ({}));
      const { description } = parseHomeOptInBody(body);
      const data = await this.userSelfService.postHomeOptIn(ctx.userId, description);
      return successResponse(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async postDateToggle(req: NextRequest, ctx: RequestContext) {
    try {
      const { wantDate } = parseDateToggleBody(await req.json());
      const data = await this.userSelfService.toggleWantDate(ctx.userId, wantDate);
      return NextResponse.json({ data });
    } catch (error) {
      return handleError(error);
    }
  }

  async postPhone(req: NextRequest, ctx: RequestContext) {
    try {
      const { phone } = parsePhoneBody(await req.json());
      const data = await this.userSelfService.updatePhone(ctx.userId, phone);
      return successResponse(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async getOptInFromToken(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token") ?? "";
    return this.userSelfService.confirmOptInFromToken(token, req.url);
  }

  async getAuthRefresh(req: NextRequest) {
    const next = req.nextUrl.searchParams.get("next") ?? "/home";
    const token = req.cookies.get("access_token")?.value;
    return this.userSelfService.buildRefreshTokenResult(
      token,
      next,
      req.url,
      ({ userId, phone, email, role, onboardingCompleted }) =>
        this.authService.issueToken(userId, phone, email, role, onboardingCompleted),
      (t) => this.authService.verifyAccessToken(t),
    );
  }
}
