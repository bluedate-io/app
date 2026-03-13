// ─── UserRepository ───────────────────────────────────────────────────────────
// All database queries related to User live here.
// Currently backed by an in-memory store so the architecture compiles
// without Prisma. Replace each method body with real Prisma/Drizzle calls.

import { v4 as uuidv4 } from "uuid";
import type { User, UserPreferences } from "@/domains/User";
import type { CreateUserInput, UpdateUserInput } from "@/validations/user.validation";
import type { PaginationParams, PaginatedResult } from "@/types";
import type { IBaseRepository } from "./base/BaseRepository";
import { buildPaginatedResult } from "@/utils/pagination";

// Internal create payload — extends the public DTO with a hashed password
export type CreateUserRepositoryInput = CreateUserInput & { passwordHash: string };

export interface IUserRepository
  extends IBaseRepository<User, CreateUserRepositoryInput, UpdateUserInput> {
  findByEmail(email: string): Promise<User | null>;
  findMany(
    params: PaginationParams & { status?: string },
  ): Promise<PaginatedResult<User>>;
}

// ─── In-memory store (replace with Prisma) ───────────────────────────────────
const store = new Map<string, User>();

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    // Prisma: return db.user.findUnique({ where: { id } });
    return store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    // Prisma: return db.user.findUnique({ where: { email } });
    for (const user of store.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<User>> {
    return this.findMany(params);
  }

  async findMany(
    params: PaginationParams & { status?: string },
  ): Promise<PaginatedResult<User>> {
    // Prisma: const [data, total] = await db.$transaction([
    //   db.user.findMany({ skip, take, where }),
    //   db.user.count({ where }),
    // ]);
    const all = Array.from(store.values()).filter(
      (u) => !params.status || u.status === params.status,
    );
    const { page, limit } = params;
    const skip = (page - 1) * limit;
    const data = all.slice(skip, skip + limit);
    return buildPaginatedResult(data, all.length, params);
  }

  async create(data: CreateUserRepositoryInput): Promise<User> {
    // Prisma: return db.user.create({ data: { ...data, id: uuidv4() } });
    const now = new Date();
    const user: User = {
      id: uuidv4(),
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: "user",
      status: "pending_verification",
      isEmailVerified: false,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    store.set(user.id, user);
    return user;
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    // Prisma: return db.user.update({ where: { id }, data });
    const existing = store.get(id);
    if (!existing) throw new Error(`User ${id} not found`);

    // Deep-merge preferences so callers can send partial preference patches
    const preferences: UserPreferences | undefined =
      data.preferences
        ? {
            minAge: data.preferences.minAge ?? existing.preferences?.minAge ?? 18,
            maxAge: data.preferences.maxAge ?? existing.preferences?.maxAge ?? 100,
            genderPreference:
              data.preferences.genderPreference ??
              existing.preferences?.genderPreference ??
              [],
            maxDistanceKm:
              data.preferences.maxDistanceKm ??
              existing.preferences?.maxDistanceKm ??
              50,
          }
        : existing.preferences;

    const updated: User = {
      ...existing,
      name: data.name ?? existing.name,
      bio: data.bio ?? existing.bio,
      avatarUrl: data.avatarUrl ?? existing.avatarUrl,
      gender: data.gender ?? existing.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : existing.dateOfBirth,
      location: data.location ?? existing.location,
      preferences,
      updatedAt: new Date(),
    };
    store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    // Prisma: await db.user.delete({ where: { id } });
    store.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    // Prisma: return !!(await db.user.findUnique({ where: { id }, select: { id: true } }));
    return store.has(id);
  }
}
