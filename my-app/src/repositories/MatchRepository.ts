// ─── MatchRepository ──────────────────────────────────────────────────────────
// All database queries for Match and Swipe models.
// Backed by Prisma 7 + Supabase (PostgreSQL).

import type {
  PrismaClient,
  Match as PrismaMatch,
  Swipe as PrismaSwipe,
} from "@/generated/prisma/client";
import type { Match, Swipe, SwipeDirection } from "@/domains/Match";
import type { PaginationParams, PaginatedResult } from "@/types";
import { buildPaginatedResult } from "@/utils/pagination";

export interface IMatchRepository {
  findMatchById(id: string): Promise<Match | null>;
  findMatchesByUserId(userId: string, params: PaginationParams): Promise<PaginatedResult<Match>>;
  findExistingSwipe(swiperId: string, swipedId: string): Promise<Swipe | null>;
  createSwipe(swiperId: string, swipedId: string, direction: SwipeDirection): Promise<Swipe>;
  createMatch(userId1: string, userId2: string, score: number, initiatedBy: string): Promise<Match>;
  updateMatchStatus(id: string, status: Match["status"]): Promise<Match>;
  findPotentialMatches(userId: string, excludeIds: string[], limit: number): Promise<string[]>;
}

// ─── Row → domain mappers ─────────────────────────────────────────────────────
function matchToDomain(row: PrismaMatch): Match {
  return {
    id: row.id,
    userId1: row.userId1,
    userId2: row.userId2,
    status: row.status as Match["status"],
    compatibilityScore: row.compatibilityScore,
    initiatedBy: row.initiatedBy,
    matchedAt: row.matchedAt ?? undefined,
    expiresAt: row.expiresAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function swipeToDomain(row: PrismaSwipe): Swipe {
  return {
    id: row.id,
    swiperId: row.swiperId,
    swipedId: row.swipedId,
    direction: row.direction as SwipeDirection,
    createdAt: row.createdAt,
  };
}

export class MatchRepository implements IMatchRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMatchById(id: string): Promise<Match | null> {
    const row = await this.db.match.findUnique({ where: { id } });
    return row ? matchToDomain(row) : null;
  }

  async findMatchesByUserId(
    userId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Match>> {
    const where = { OR: [{ userId1: userId }, { userId2: userId }] };
    const skip = (params.page - 1) * params.limit;

    const [rows, total] = await this.db.$transaction([
      this.db.match.findMany({ where, skip, take: params.limit, orderBy: { createdAt: "desc" } }),
      this.db.match.count({ where }),
    ]);

    return buildPaginatedResult(rows.map(matchToDomain), total, params);
  }

  async findExistingSwipe(swiperId: string, swipedId: string): Promise<Swipe | null> {
    const row = await this.db.swipe.findUnique({ where: { swiperId_swipedId: { swiperId, swipedId } } });
    return row ? swipeToDomain(row) : null;
  }

  async createSwipe(swiperId: string, swipedId: string, direction: SwipeDirection): Promise<Swipe> {
    const row = await this.db.swipe.create({ data: { swiperId, swipedId, direction } });
    return swipeToDomain(row);
  }

  async createMatch(
    userId1: string,
    userId2: string,
    score: number,
    initiatedBy: string,
  ): Promise<Match> {
    const row = await this.db.match.create({
      data: { userId1, userId2, compatibilityScore: score, initiatedBy },
    });
    return matchToDomain(row);
  }

  async updateMatchStatus(id: string, status: Match["status"]): Promise<Match> {
    const row = await this.db.match.update({
      where: { id },
      data: {
        status,
        ...(status === "accepted" && { matchedAt: new Date() }),
      },
    });
    return matchToDomain(row);
  }

  async findPotentialMatches(userId: string, excludeIds: string[], limit: number): Promise<string[]> {
    // Find users who haven't been swiped yet, excluding the given ids.
    // For geo/preference filtering, extend the `where` clause here.
    const swipedRows = await this.db.swipe.findMany({
      where: { swiperId: userId },
      select: { swipedId: true },
    });
    const alreadySwiped = swipedRows.map((s) => s.swipedId);
    const excluded = new Set([userId, ...excludeIds, ...alreadySwiped]);

    const candidates = await this.db.user.findMany({
      where: { id: { notIn: Array.from(excluded) }, status: "active" },
      select: { id: true },
      take: limit,
    });

    return candidates.map((c) => c.id);
  }
}
