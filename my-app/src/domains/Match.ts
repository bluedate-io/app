// ─── Match Domain Entity ──────────────────────────────────────────────────────

export type MatchStatus = "pending" | "accepted" | "rejected" | "expired" | "unmatched";
export type SwipeDirection = "like" | "dislike" | "super_like";

export interface Match {
  id: string;
  userId1: string;
  userId2: string;
  status: MatchStatus;
  compatibilityScore: number; // 0-1 float
  initiatedBy: string;        // userId who triggered the match
  matchedAt?: Date;           // set when both parties accept
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Swipe {
  id: string;
  swiperId: string;
  swipedId: string;
  direction: SwipeDirection;
  createdAt: Date;
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

export function isMutualMatch(swipes: Swipe[], userId1: string, userId2: string): boolean {
  const forward = swipes.some(
    (s) => s.swiperId === userId1 && s.swipedId === userId2 && s.direction !== "dislike",
  );
  const backward = swipes.some(
    (s) => s.swiperId === userId2 && s.swipedId === userId1 && s.direction !== "dislike",
  );
  return forward && backward;
}

export function isMatchExpired(match: Match): boolean {
  if (!match.expiresAt) return false;
  return new Date() > match.expiresAt;
}
