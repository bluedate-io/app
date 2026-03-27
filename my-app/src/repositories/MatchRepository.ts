import type { PrismaClient } from "@/generated/prisma/client";

export type MatchPartnerRecord = {
  id: string;
  email: string | null;
  collegeName: string | null;
  profile: {
    fullName: string | null;
    age: number | null;
    bio: string | null;
  } | null;
  preferences: {
    genderIdentity: string | null;
  } | null;
  photos: Array<{ url: string }>;
  weeklyOptIns: Array<{ description: string | null }>;
};

export type UserMatchRecord = {
  id: string;
  userId1: string;
  userId2: string;
  matchedAt: Date;
  cardImageUrl: string | null;
  blurb: string | null;
  user1: MatchPartnerRecord;
  user2: MatchPartnerRecord;
};

export interface IMatchRepository {
  findActiveMatchesForUser(userId: string): Promise<UserMatchRecord[]>;
}

export class MatchRepository implements IMatchRepository {
  constructor(private readonly db: PrismaClient) {}

  async findActiveMatchesForUser(userId: string): Promise<UserMatchRecord[]> {
    return this.db.match.findMany({
      where: {
        status: "active",
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      orderBy: { matchedAt: "desc" },
      include: {
        user1: {
          select: {
            id: true,
            email: true,
            collegeName: true,
            profile: { select: { fullName: true, age: true, bio: true } },
            preferences: { select: { genderIdentity: true } },
            photos: { select: { url: true }, orderBy: { order: "asc" } },
            weeklyOptIns: {
              select: { description: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        user2: {
          select: {
            id: true,
            email: true,
            collegeName: true,
            profile: { select: { fullName: true, age: true, bio: true } },
            preferences: { select: { genderIdentity: true } },
            photos: { select: { url: true }, orderBy: { order: "asc" } },
            weeklyOptIns: {
              select: { description: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });
  }
}
