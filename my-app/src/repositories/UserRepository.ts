// ─── UserRepository ───────────────────────────────────────────────────────────
// All database queries for the User model (phone-first auth schema).

import type { PrismaClient, User as PrismaUser } from "@/generated/prisma/client";
import type { User } from "@/domains/User";
import type { PaginationParams, PaginatedResult } from "@/types";
import { buildPaginatedResult } from "@/utils/pagination";

function toDomain(row: PrismaUser): User {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email ?? undefined,
    role: row.role as User["role"],
    onboardingCompleted: row.onboardingCompleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<User>>;
  findOrCreate(phone: string): Promise<{ user: User; created: boolean }>;
  updateEmail(id: string, email: string): Promise<User>;
  completeOnboarding(id: string): Promise<User>;
  exists(id: string): Promise<boolean>;
  delete(id: string): Promise<void>;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { phone } });
    return row ? toDomain(row) : null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<User>> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;
    const [rows, total] = await this.db.$transaction([
      this.db.user.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.db.user.count(),
    ]);
    return buildPaginatedResult(rows.map(toDomain), total, params);
  }

  async findOrCreate(phone: string): Promise<{ user: User; created: boolean }> {
    const existing = await this.db.user.findUnique({ where: { phone } });
    if (existing) return { user: toDomain(existing), created: false };

    const row = await this.db.user.create({ data: { phone } });
    return { user: toDomain(row), created: true };
  }

  async updateEmail(id: string, email: string): Promise<User> {
    const row = await this.db.user.update({ where: { id }, data: { email } });
    return toDomain(row);
  }

  async completeOnboarding(id: string): Promise<User> {
    const row = await this.db.user.update({
      where: { id },
      data: { onboardingCompleted: true },
    });
    return toDomain(row);
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.user.findUnique({ where: { id }, select: { id: true } });
    return row !== null;
  }

  async delete(id: string): Promise<void> {
    await this.db.user.delete({ where: { id } });
  }
}
