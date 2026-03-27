import jwt from "jsonwebtoken";
import { config } from "@/config";
import { TwilioService } from "@/services/TwilioService";
import { UserRepository } from "@/repositories/UserRepository";
import { UserSelfRepository } from "@/repositories/UserSelfRepository";
import { ForbiddenError } from "@/utils/errors";

export class AdminAuthService {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly userRepository: UserRepository,
    private readonly userSelfRepository: UserSelfRepository,
  ) {}

  async verifyOtp(phone: string, code: string) {
    if (!phone || phone.replace(/\D/g, "") !== config.admin.phone) {
      throw new ForbiddenError("Unauthorized");
    }
    const fullPhone = `+91${config.admin.phone}`;
    await this.twilioService.checkVerification(fullPhone, code);
    const { user } = await this.userRepository.findOrCreate(fullPhone);
    if (user.role !== "admin") {
      await this.userSelfRepository.ensureUserRoleAdmin(user.id);
    }
    const token = jwt.sign(
      { sub: user.id, phone: user.phone, role: "admin", onboardingCompleted: true },
      config.auth.jwtSecret,
      { expiresIn: "24h" },
    );
    return { token };
  }
}

