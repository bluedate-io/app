// ─── MatchmakingService ───────────────────────────────────────────────────────
// Drives the swipe → match pipeline and compatibility scoring.

import type { IMatchRepository } from "@/repositories/MatchRepository";
import type { IUserRepository } from "@/repositories/UserRepository";
import type { Match } from "@/domains/Match";
import type { SwipeInput } from "@/validations/match.validation";
import { MATCH_SCORE_THRESHOLD } from "@/constants";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { isProfileComplete } from "@/domains/User";
import { ErrorCode } from "@/constants/errors";
import { AppError } from "@/types";

const log = logger.child("MatchmakingService");

export class MatchmakingService {
  constructor(
    private readonly matchRepository: IMatchRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  // ─── Swipe ────────────────────────────────────────────────────────────────────

  async swipe(
    swiperId: string,
    input: SwipeInput,
  ): Promise<{ matched: boolean; match?: Match }> {
    const { targetUserId, direction } = input;

    if (swiperId === targetUserId) {
      throw new BadRequestError("You cannot swipe on yourself");
    }

    // Verify both users exist
    const [swiper, target] = await Promise.all([
      this.userRepository.findById(swiperId),
      this.userRepository.findById(targetUserId),
    ]);

    if (!swiper) throw new NotFoundError("User", swiperId);
    if (!target) throw new NotFoundError("User", targetUserId);

    if (!isProfileComplete(swiper)) {
      throw new AppError(
        "Complete your profile before you can swipe",
        ErrorCode.PROFILE_INCOMPLETE,
        403,
      );
    }

    // Prevent duplicate swipes
    const existingSwipe = await this.matchRepository.findExistingSwipe(swiperId, targetUserId);
    if (existingSwipe) {
      throw new BadRequestError("You have already swiped on this user");
    }

    await this.matchRepository.createSwipe(swiperId, targetUserId, direction);
    log.info("Swipe recorded", { swiperId, targetUserId, direction });

    // Check if the other party already liked us
    if (direction !== "dislike") {
      const reverseSwipe = await this.matchRepository.findExistingSwipe(targetUserId, swiperId);
      if (reverseSwipe && reverseSwipe.direction !== "dislike") {
        // Mutual like → create a match
        const score = this.calculateCompatibility(swiperId, targetUserId);
        const match = await this.matchRepository.createMatch(
          swiperId,
          targetUserId,
          score,
          swiperId,
        );
        log.info("New match created", { matchId: match.id, score });
        return { matched: true, match };
      }
    }

    return { matched: false };
  }

  // ─── Potential matches queue ──────────────────────────────────────────────────

  async getPotentialMatches(userId: string, limit = 20): Promise<string[]> {
    return this.matchRepository.findPotentialMatches(userId, [], limit);
  }

  // ─── Accept / reject a pending match ─────────────────────────────────────────

  async respondToMatch(
    userId: string,
    matchId: string,
    accept: boolean,
  ): Promise<Match> {
    const match = await this.matchRepository.findMatchById(matchId);
    if (!match) throw new NotFoundError("Match", matchId);

    const isParticipant = match.userId1 === userId || match.userId2 === userId;
    if (!isParticipant) throw new BadRequestError("You are not a participant in this match");

    const newStatus = accept ? "accepted" : "rejected";
    return this.matchRepository.updateMatchStatus(matchId, newStatus);
  }

  // ─── Naive compatibility scorer (replace with ML model or weighted algo) ───────

  private calculateCompatibility(_userId1: string, _userId2: string): number {
    // Placeholder: return a score above threshold so matches can form.
    // Real implementation: fetch preference vectors, calculate cosine similarity, etc.
    return MATCH_SCORE_THRESHOLD + Math.random() * (1 - MATCH_SCORE_THRESHOLD);
  }
}
