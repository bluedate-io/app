// ─── MatchRepository ──────────────────────────────────────────────────────────

import { v4 as uuidv4 } from "uuid";
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

// ─── In-memory store ─────────────────────────────────────────────────────────
const matchStore = new Map<string, Match>();
const swipeStore = new Map<string, Swipe>();

export class MatchRepository implements IMatchRepository {
  async findMatchById(id: string): Promise<Match | null> {
    return matchStore.get(id) ?? null;
  }

  async findMatchesByUserId(
    userId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Match>> {
    const all = Array.from(matchStore.values()).filter(
      (m) => m.userId1 === userId || m.userId2 === userId,
    );
    const { page, limit } = params;
    const data = all.slice((page - 1) * limit, page * limit);
    return buildPaginatedResult(data, all.length, params);
  }

  async findExistingSwipe(swiperId: string, swipedId: string): Promise<Swipe | null> {
    for (const swipe of swipeStore.values()) {
      if (swipe.swiperId === swiperId && swipe.swipedId === swipedId) return swipe;
    }
    return null;
  }

  async createSwipe(swiperId: string, swipedId: string, direction: SwipeDirection): Promise<Swipe> {
    const swipe: Swipe = { id: uuidv4(), swiperId, swipedId, direction, createdAt: new Date() };
    swipeStore.set(swipe.id, swipe);
    return swipe;
  }

  async createMatch(
    userId1: string,
    userId2: string,
    score: number,
    initiatedBy: string,
  ): Promise<Match> {
    const now = new Date();
    const match: Match = {
      id: uuidv4(),
      userId1,
      userId2,
      status: "pending",
      compatibilityScore: score,
      initiatedBy,
      createdAt: now,
      updatedAt: now,
    };
    matchStore.set(match.id, match);
    return match;
  }

  async updateMatchStatus(id: string, status: Match["status"]): Promise<Match> {
    const match = matchStore.get(id);
    if (!match) throw new Error(`Match ${id} not found`);
    const updated: Match = {
      ...match,
      status,
      matchedAt: status === "accepted" ? new Date() : match.matchedAt,
      updatedAt: new Date(),
    };
    matchStore.set(id, updated);
    return updated;
  }

  async findPotentialMatches(
    userId: string,
    excludeIds: string[],
    limit: number,
  ): Promise<string[]> {
    // Placeholder — replace with a geo-indexed or preference-filtered DB query
    const exclude = new Set([userId, ...excludeIds]);
    const swipedIds = new Set(
      Array.from(swipeStore.values())
        .filter((s) => s.swiperId === userId)
        .map((s) => s.swipedId),
    );
    return Array.from(matchStore.values())
      .map((m) => (m.userId1 === userId ? m.userId2 : m.userId1))
      .filter((id) => !exclude.has(id) && !swipedIds.has(id))
      .slice(0, limit);
  }
}
