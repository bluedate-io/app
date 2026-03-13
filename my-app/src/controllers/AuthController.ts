// ─── AuthController ───────────────────────────────────────────────────────────

import { NextRequest } from "next/server";
import { loginSchema, refreshTokenSchema } from "@/validations/auth.validation";
import { createUserSchema } from "@/validations/user.validation";
import type { AuthService } from "@/services/AuthService";
import { successResponse, createdResponse, handleError } from "@/utils/response";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: NextRequest) {
    try {
      const body = await req.json();
      const input = createUserSchema.parse(body);
      const result = await this.authService.register(input);
      return createdResponse(result, "Registration successful");
    } catch (error) {
      return handleError(error);
    }
  }

  async login(req: NextRequest) {
    try {
      const body = await req.json();
      const input = loginSchema.parse(body);
      const result = await this.authService.login(input);
      return successResponse(result, { message: "Login successful" });
    } catch (error) {
      return handleError(error);
    }
  }

  async refresh(req: NextRequest) {
    try {
      const body = await req.json();
      const { refreshToken } = refreshTokenSchema.parse(body);
      const tokens = await this.authService.refreshTokens(refreshToken);
      return successResponse(tokens);
    } catch (error) {
      return handleError(error);
    }
  }
}
