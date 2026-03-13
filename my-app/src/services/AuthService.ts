// ─── AuthService ──────────────────────────────────────────────────────────────
// Handles registration, login, token issuance and refresh.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import { JWT_EXPIRY, REFRESH_TOKEN_EXPIRY, SALT_ROUNDS } from "@/constants";
import type { IUserRepository } from "@/repositories/UserRepository";
import type { LoginInput } from "@/validations/auth.validation";
import type { CreateUserInput } from "@/validations/user.validation";
import type { JwtPayload } from "@/types";
import type { LoginResponseDTO, AuthTokensDTO } from "@/dto/LoginDTO";
import { toUserResponseDTO } from "@/dto/UserResponseDTO";
import { UnauthorizedError, ConflictError } from "@/utils/errors";
import { logger } from "@/utils/logger";

const log = logger.child("AuthService");

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  // ─── Register ───────────────────────────────────────────────────────────────

  async register(input: CreateUserInput): Promise<LoginResponseDTO> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError(`Email '${input.email}' is already registered`);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.userRepository.create({ ...input, passwordHash });

    log.info("New user registered", { userId: user.id });

    const tokens = this.issueTokens(user.id, user.email, user.role);
    return { user: toUserResponseDTO(user), tokens };
  }

  // ─── Login ──────────────────────────────────────────────────────────────────

  async login(input: LoginInput): Promise<LoginResponseDTO> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new UnauthorizedError("Invalid email or password");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    log.info("User logged in", { userId: user.id });

    const tokens = this.issueTokens(user.id, user.email, user.role);
    return { user: toUserResponseDTO(user), tokens };
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────

  async refreshTokens(refreshToken: string): Promise<AuthTokensDTO> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, config.auth.jwtRefreshSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedError("User no longer exists");

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ─── Token verification (used by middleware) ─────────────────────────────────

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private issueTokens(userId: string, email: string, role: string): AuthTokensDTO {
    const payload: Omit<JwtPayload, "iat" | "exp"> = {
      sub: userId,
      email,
      role: role as JwtPayload["role"],
    };

    const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: JWT_EXPIRY,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.auth.jwtRefreshSecret, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    } as jwt.SignOptions);

    // 7 days in seconds
    const expiresIn = 7 * 24 * 60 * 60;

    return { accessToken, refreshToken, expiresIn };
  }
}
