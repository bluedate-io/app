import type { SwipeDirection } from "@/domains/Match";

export interface SwipeDTO {
  targetUserId: string;
  direction: SwipeDirection;
}

export interface MatchResponseDTO {
  id: string;
  userId1: string;
  userId2: string;
  status: string;
  compatibilityScore: number;
  matchedAt?: string;
  createdAt: string;
}
