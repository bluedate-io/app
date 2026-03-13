// ─── UserRepository ───────────────────────────────────────────────────────────
// All database queries for the User model.
// Backed by Prisma 7 + Supabase (PostgreSQL).

import type { PrismaClient, User as PrismaUser } from "@/generated/prisma/client";
import type { User, UserPreferences } from "@/domains/User";
import type { CreateUserInput, UpdateUserInput } from "@/validations/user.validation";
import type { PaginationParams, PaginatedResult } from "@/types";
import type { IBaseRepository } from "./base/BaseRepository";
import { buildPaginatedResult } from "@/utils/pagination";

export type CreateUserRepositoryInput = CreateUserInput & { passwordHash: string };

export interface IUserRepository
  extends IBaseRepository<User, CreateUserRepositoryInput, UpdateUserInput> {
  findByEmail(email: string): Promise<User | null>;
  findMany(params: PaginationParams & { status?: string }): Promise<PaginatedResult<User>>;
}

// ─── Prisma row → domain mapper ───────────────────────────────────────────────
// Converts raw Prisma rows (Json fields typed as `unknown`) to clean domain objects.
function toDomain(row: PrismaUser): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    name: row.name,
    role: row.role as User["role"],
    status: row.status as User["status"],
    gender: (row.gender as User["gender"]) ?? undefined,
    dateOfBirth: row.dateOfBirth ?? undefined,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
    location: (row.location as unknown as User["location"]) ?? undefined,
    preferences: (row.preferences as unknown as User["preferences"]) ?? undefined,
    isEmailVerified: row.isEmailVerified,
    lastSeenAt: row.lastSeenAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class UserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<User>> {
    return this.findMany(params);
  }

  async findMany(
    params: PaginationParams & { status?: string },
  ): Promise<PaginatedResult<User>> {
    const { page, limit, status } = params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where = status ? { status: status as any } : {};
    const skip = (page - 1) * limit;

    const [rows, total] = await this.db.$transaction([
      this.db.user.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.db.user.count({ where }),
    ]);

    return buildPaginatedResult(rows.map(toDomain), total, params);
  }

  async create(data: CreateUserRepositoryInput): Promise<User> {
    const row = await this.db.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const existing = await this.db.user.findUnique({ where: { id } });
    if (!existing) throw new Error(`User ${id} not found`);

    const existingPrefs = existing.preferences as unknown as UserPreferences | undefined;
    const preferences: UserPreferences | undefined = data.preferences
      ? {
          minAge: data.preferences.minAge ?? existingPrefs?.minAge ?? 18,
          maxAge: data.preferences.maxAge ?? existingPrefs?.maxAge ?? 100,
          genderPreference:
            data.preferences.genderPreference ?? existingPrefs?.genderPreference ?? [],
          maxDistanceKm: data.preferences.maxDistanceKm ?? existingPrefs?.maxDistanceKm ?? 50,
        }
      : undefined;

    const row = await this.db.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.gender && { gender: data.gender }),
        ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(data.location && { location: data.location as any }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(preferences && { preferences: preferences as any }),
      },
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.user.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.db.user.findUnique({ where: { id }, select: { id: true } });
    return row !== null;
  }
}
