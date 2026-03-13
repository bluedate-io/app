// ─── AuthController ───────────────────────────────────────────────────────────
// Thin HTTP adapter — parse input, call service, return response.

import { NextRequest } from "next/server";
import { sendOtpSchema, verifyOtpSchema } from "@/validations/otp.validation";
import type { AuthService } from "@/services/AuthService";
import type { IUserRepository } from "@/repositories/UserRepository";
import { successResponse, createdResponse, handleError } from "@/utils/response";
import { toUserAuthDTO } from "@/dto/OtpDTO";
import type { RequestContext } from "@/types";
import { NotFoundError } from "@/utils/errors";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: IUserRepository,
  ) {}

  // POST /api/auth/send-otp
  async sendOtp(req: NextRequest) {
    try {
      const body = await req.json();
      const input = sendOtpSchema.parse(body);
      const result = await this.authService.sendOtp(input);
      return createdResponse(result, "OTP sent");
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/auth/verify-otp
  async verifyOtp(req: NextRequest) {
    try {
      const body = await req.json();
      const input = verifyOtpSchema.parse(body);
      const result = await this.authService.verifyOtp(input);
      return successResponse(result, { message: "Authenticated successfully" });
    } catch (error) {
      return handleError(error);
    }
  }

  // GET /api/auth/me  (requires valid JWT)
  async me(_req: NextRequest, ctx: RequestContext) {
    try {
      const user = await this.userRepository.findById(ctx.userId);
      if (!user) throw new NotFoundError("User", ctx.userId);
      return successResponse(toUserAuthDTO(user));
    } catch (error) {
      return handleError(error);
    }
  }
}
