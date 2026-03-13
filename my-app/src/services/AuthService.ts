// ─── AuthService ──────────────────────────────────────────────────────────────
// Phone-first OTP authentication via Twilio Verify.
// Flow: sendOtp → verifyOtp (issues JWT) → me (reads JWT)
// Twilio Verify manages code generation, delivery, expiry, and rate-limiting.

import jwt from "jsonwebtoken";
import { config } from "@/config";
import type { IUserRepository } from "@/repositories/UserRepository";
import type { ITwilioService } from "@/services/TwilioService";
import type { SendOtpInput, VerifyOtpInput } from "@/validations/otp.validation";
import type { JwtPayload } from "@/types";
import type { SendOtpResponseDTO, VerifyOtpResponseDTO } from "@/dto/OtpDTO";
import { toUserAuthDTO } from "@/dto/OtpDTO";
import { UnauthorizedError } from "@/utils/errors";
import { logger } from "@/utils/logger";

const log = logger.child("AuthService");

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly twilioService: ITwilioService,
  ) {}

  // ─── Step 1: Trigger Twilio Verify SMS ──────────────────────────────────────

  async sendOtp(input: SendOtpInput): Promise<SendOtpResponseDTO> {
    await this.twilioService.sendVerification(input.phone);
    log.info("Verification sent", { phone: input.phone });
    return {
      message: "OTP sent successfully. Valid for 10 minutes.",
      expiresInMinutes: 10,
    };
  }

  // ─── Step 2: Check code → find/create user → issue JWT ─────────────────────

  async verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResponseDTO> {
    // Throws OtpInvalidError if code is wrong or expired
    await this.twilioService.checkVerification(input.phone, input.code);

    const { user, created } = await this.userRepository.findOrCreate(input.phone);

    if (created) log.info("New user created via OTP", { userId: user.id });
    else log.info("Existing user authenticated via OTP", { userId: user.id });

    const token = this.issueToken(
      user.id,
      user.phone,
      user.email,
      user.role,
      user.onboardingCompleted,
    );

    return {
      user: toUserAuthDTO(user),
      token,
      onboardingCompleted: user.onboardingCompleted,
      redirectTo: user.onboardingCompleted ? "/" : "/onboarding",
    };
  }

  // ─── Token verification (used by auth middleware) ───────────────────────────

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private issueToken(
    userId: string,
    phone: string,
    email: string | undefined,
    role: string,
    onboardingCompleted: boolean,
  ) {
    const payload: Omit<JwtPayload, "iat" | "exp"> = {
      sub: userId,
      phone,
      email,
      role: role as JwtPayload["role"],
      onboardingCompleted,
    };

    const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiry,
    } as jwt.SignOptions);

    return { accessToken, expiresIn: 7 * 24 * 60 * 60 };
  }
}
