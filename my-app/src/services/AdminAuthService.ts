import jwt from "jsonwebtoken";
import { config } from "@/config";
import type { IEmailService } from "@/services/EmailService";
import { UserRepository } from "@/repositories/UserRepository";
import { UserSelfRepository } from "@/repositories/UserSelfRepository";
import { BadRequestError } from "@/utils/errors";

export class AdminAuthService {
  constructor(
    private readonly emailService: IEmailService,
    private readonly userRepository: UserRepository,
    private readonly userSelfRepository: UserSelfRepository,
  ) {}

  private normalizeEmail(email: unknown): string {
    return typeof email === "string" ? email.trim().toLowerCase() : "";
  }

  private assertValidAdminEmail(email: string) {
    const allowedAdminEmail = config.admin.email.trim().toLowerCase();
    if (email !== allowedAdminEmail) {
      throw new BadRequestError("Invalid admin email");
    }
  }

  async sendOtp(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    this.assertValidAdminEmail(normalizedEmail);
    await this.emailService.sendOtp(normalizedEmail);
    return { message: "OTP sent", expiresInMinutes: config.auth.otpTtlMinutes };
  }

  async verifyOtp(email: string, code: string) {
    const normalizedEmail = this.normalizeEmail(email);
    this.assertValidAdminEmail(normalizedEmail);
    await this.emailService.verifyOtp(normalizedEmail, code);
    const { user } = await this.userRepository.findOrCreateByEmail(normalizedEmail, "");
    if (user.role !== "admin") {
      await this.userSelfRepository.ensureUserRoleAdmin(user.id);
    }
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: "admin", onboardingCompleted: true },
      config.auth.jwtSecret,
      { expiresIn: "24h" },
    );
    return { token };
  }
}

