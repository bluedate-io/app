// ─── UserService ──────────────────────────────────────────────────────────────
// All user-related business logic lives here.
// Controllers call this; this calls repositories.

import bcrypt from "bcryptjs";
import { SALT_ROUNDS } from "@/constants";
import type { IUserRepository } from "@/repositories/UserRepository";
import type { CreateUserInput, UpdateUserInput } from "@/validations/user.validation";
import type { PaginatedResult, PaginationParams } from "@/types";
import { ConflictError, NotFoundError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { toUserResponseDTO, type UserResponseDTO } from "@/dto/UserResponseDTO";

const log = logger.child("UserService");

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(input: CreateUserInput): Promise<UserResponseDTO> {
    log.info("Creating user", { email: input.email });

    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError(`A user with email '${input.email}' already exists`);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.userRepository.create({ ...input, passwordHash });
    log.info("User created", { userId: user.id });

    return toUserResponseDTO(user);
  }

  async getUserById(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError("User", id);
    return toUserResponseDTO(user);
  }

  async getUserByEmail(email: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new NotFoundError("User");
    return toUserResponseDTO(user);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<UserResponseDTO> {
    const exists = await this.userRepository.exists(id);
    if (!exists) throw new NotFoundError("User", id);

    const user = await this.userRepository.update(id, input);
    return toUserResponseDTO(user);
  }

  async deleteUser(id: string): Promise<void> {
    const exists = await this.userRepository.exists(id);
    if (!exists) throw new NotFoundError("User", id);
    await this.userRepository.delete(id);
    log.info("User deleted", { userId: id });
  }

  async listUsers(params: PaginationParams): Promise<PaginatedResult<UserResponseDTO>> {
    const result = await this.userRepository.findAll(params);
    return {
      ...result,
      data: result.data.map(toUserResponseDTO),
    };
  }
}
