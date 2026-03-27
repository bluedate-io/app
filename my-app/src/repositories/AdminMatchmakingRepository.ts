// ─── AdminMatchmakingRepository — Prisma access for admin pool / candidates / create ─

import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export const adminMatchUserInclude = {
  profile: {
    select: {
      fullName: true,
      nickname: true,
      dateOfBirth: true,
      age: true,
      city: true,
      bio: true,
    },
  },
  preferences: {
    select: {
      genderIdentity: true,
      genderPreference: true,
      ageRangeMin: true,
      ageRangeMax: true,
      relationshipIntent: true,
      relationshipGoals: true,
      heightCm: true,
      heightCompleted: true,
      wantDate: true,
      datingModeCompleted: true,
      photosStepCompleted: true,
    },
  },
  interests: {
    select: {
      hobbies: true,
      favouriteActivities: true,
      musicTaste: true,
      foodTaste: true,
      bffInterests: true,
      bffInterestsCompleted: true,
    },
  },
  personality: {
    select: {
      smokingHabit: true,
      drinkingHabit: true,
      funFact: true,
      kidsStatus: true,
      kidsPreference: true,
      religion: true,
      politics: true,
      importantLifeCompleted: true,
      familyPlansCompleted: true,
      lifeExperiences: true,
      lifeExperiencesCompleted: true,
      relationshipStatus: true,
      relationshipStatusCompleted: true,
    },
  },
  availability: { select: { days: true, times: true } },
  aiSignals: { select: { selfDescription: true, idealPartner: true, idealDate: true } },
  weeklyOptIns: {
    select: { weekStart: true, mode: true, description: true, createdAt: true },
    orderBy: { weekStart: "desc" },
    take: 3,
  },
  photos: {
    select: { url: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  },
} satisfies Prisma.UserInclude;

export type AdminMatchUserRow = Prisma.UserGetPayload<{ include: typeof adminMatchUserInclude }>;

export interface IAdminMatchmakingRepository {
  findCollegeDomains(): Promise<Array<{ domain: string; collegeName: string }>>;
  findDomainsByCollegeNames(collegeNames: string[]): Promise<string[]>;
  findUsersForPool(where: Prisma.UserWhereInput): Promise<AdminMatchUserRow[]>;
  findActiveMatchesAmongUserIds(userIds: string[]): Promise<Array<{ userId1: string; userId2: string }>>;
  findUserAForCandidates(userId: string): Promise<{
    id: string;
    email: string | null;
    profile: { city: string | null } | null;
    preferences: { genderIdentity: string | null } | null;
  } | null>;
  findCandidateUsers(where: Prisma.UserWhereInput): Promise<AdminMatchUserRow[]>;
  findMatchesBetweenUserAndCandidates(
    userId: string,
    candidateIds: string[],
  ): Promise<Array<{ userId1: string; userId2: string }>>;
  createMatchWithOptOuts(input: {
    userAId: string;
    userBId: string;
    adminId: string;
    cardImageUrl: string;
  }): Promise<{ id: string; matchedAt: Date }>;
  findUsersForPostMatchEmails(userIds: string[]): Promise<
    Array<{ id: string; email: string | null; profile: { fullName: string | null } | null }>
  >;
}

export class AdminMatchmakingRepository implements IAdminMatchmakingRepository {
  constructor(private readonly db: PrismaClient) {}

  async findCollegeDomains(): Promise<Array<{ domain: string; collegeName: string }>> {
    return this.db.collegeDomain.findMany({
      select: { domain: true, collegeName: true },
    });
  }

  async findDomainsByCollegeNames(collegeNames: string[]): Promise<string[]> {
    if (collegeNames.length === 0) return [];
    const rows = await this.db.collegeDomain.findMany({
      where: { collegeName: { in: collegeNames } },
      select: { domain: true },
    });
    return rows.map((d) => d.domain.trim().toLowerCase()).filter(Boolean);
  }

  async findUsersForPool(where: Prisma.UserWhereInput): Promise<AdminMatchUserRow[]> {
    return this.db.user.findMany({
      where,
      include: adminMatchUserInclude,
    });
  }

  async findActiveMatchesAmongUserIds(
    userIds: string[],
  ): Promise<Array<{ userId1: string; userId2: string }>> {
    if (userIds.length === 0) return [];
    return this.db.match.findMany({
      where: {
        status: "active",
        OR: [{ userId1: { in: userIds } }, { userId2: { in: userIds } }],
      },
      select: { userId1: true, userId2: true },
    });
  }

  async findUserAForCandidates(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        profile: { select: { city: true } },
        preferences: { select: { genderIdentity: true } },
      },
    });
  }

  async findCandidateUsers(where: Prisma.UserWhereInput): Promise<AdminMatchUserRow[]> {
    return this.db.user.findMany({
      where,
      include: adminMatchUserInclude,
    });
  }

  async findMatchesBetweenUserAndCandidates(userId: string, candidateIds: string[]) {
    if (candidateIds.length === 0) return [];
    return this.db.match.findMany({
      where: {
        status: "active",
        OR: [
          { userId1: userId, userId2: { in: candidateIds } },
          { userId2: userId, userId1: { in: candidateIds } },
        ],
      },
      select: { userId1: true, userId2: true },
    });
  }

  async createMatchWithOptOuts(input: {
    userAId: string;
    userBId: string;
    adminId: string;
    cardImageUrl: string;
  }): Promise<{ id: string; matchedAt: Date }> {
    const now = new Date();
    const [match] = await this.db.$transaction([
      this.db.match.create({
        data: {
          userId1: input.userAId,
          userId2: input.userBId,
          matchedBy: input.adminId,
          cardImageUrl: input.cardImageUrl,
        },
      }),
      this.db.user.update({
        where: { id: input.userAId },
        data: { optInStatus: "opted_out", lastMatchedAt: now },
      }),
      this.db.user.update({
        where: { id: input.userBId },
        data: { optInStatus: "opted_out", lastMatchedAt: now },
      }),
    ]);
    return { id: match.id, matchedAt: match.matchedAt };
  }

  async findUsersForPostMatchEmails(userIds: string[]) {
    return this.db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, profile: { select: { fullName: true } } },
    });
  }
}
