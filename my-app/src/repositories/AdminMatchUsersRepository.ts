import type { PrismaClient } from "@/generated/prisma/client";
import { getWeekStartIST } from "@/utils/istTime";

const suggestionUserSelect = {
  id: true,
  collegeName: true,
  onboardingCompleted: true,
  profile: { select: { fullName: true, age: true, city: true, bio: true } },
  preferences: {
    select: {
      genderIdentity: true,
      genderPreference: true,
      ageRangeMin: true,
      ageRangeMax: true,
      heightCm: true,
      relationshipIntent: true,
      wantDate: true,
    },
  },
  personality: {
    select: {
      religion: true,
      smokingHabit: true,
      drinkingHabit: true,
      kidsStatus: true,
      kidsPreference: true,
    },
  },
  interests: { select: { hobbies: true, favouriteActivities: true } },
  photos: { orderBy: { order: "asc" as const }, take: 1, select: { url: true } },
};

export class AdminMatchUsersRepository {
  constructor(private readonly db: PrismaClient) {}

  getCurrentWeekStart(now = new Date()): Date {
    return getWeekStartIST(now);
  }

  async findActiveMatches() {
    return this.db.match.findMany({
      where: { status: "active" },
      select: { userId1: true, userId2: true },
    });
  }

  async findWeeklyOptInsForWeek(weekStart: Date) {
    return this.db.weeklyOptIn.findMany({
      where: { weekStart },
      select: {
        userId: true,
        mode: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            collegeName: true,
            onboardingCompleted: true,
            profile: { select: { fullName: true, age: true, city: true } },
            preferences: { select: { genderIdentity: true, genderPreference: true } },
            photos: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findWeeklyOptInByUserForCurrentWeek(userId: string, weekStart: Date) {
    return this.db.weeklyOptIn.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      select: {
        mode: true,
        description: true,
        user: { select: suggestionUserSelect },
      },
    });
  }

  async findAdminSkipsForUser(userId: string) {
    return this.db.adminSkip.findMany({
      where: { OR: [{ userId1: userId }, { userId2: userId }] },
      select: { userId1: true, userId2: true },
    });
  }

  async findCandidateWeeklyOptInsSameCollege(weekStart: Date, userId: string, collegeName: string) {
    return this.db.weeklyOptIn.findMany({
      where: {
        weekStart,
        userId: { not: userId },
        user: { collegeName, onboardingCompleted: true },
      },
      select: {
        mode: true,
        description: true,
        userId: true,
        user: { select: suggestionUserSelect },
      },
    });
  }

  async upsertAdminSkip(userId1: string, userId2: string, adminId: string) {
    return this.db.adminSkip.upsert({
      where: { userId1_userId2: { userId1, userId2 } },
      create: { userId1, userId2, skippedBy: adminId },
      update: { skippedBy: adminId, skippedAt: new Date() },
    });
  }

  async findUsersForCandidatesByGender(genderIdentity: "Woman" | "Man") {
    return this.db.user.findMany({
      where: { onboardingCompleted: true, role: "user", preferences: { wantDate: true, genderIdentity } },
      include: {
        profile: { select: { fullName: true, age: true, city: true, bio: true } },
        preferences: {
          select: {
            heightCm: true,
            relationshipIntent: true,
            ageRangeMin: true,
            ageRangeMax: true,
            genderPreference: true,
          },
        },
        personality: {
          select: {
            religion: true,
            kidsPreference: true,
            kidsStatus: true,
            smokingHabit: true,
            drinkingHabit: true,
          },
        },
        interests: { select: { hobbies: true, favouriteActivities: true } },
        photos: { orderBy: { order: "asc" as const }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async createLegacyMatchWithOptOuts(input: {
    userId1: string;
    userId2: string;
    adminId: string;
    blurb?: string | null;
    cardImageUrl?: string | null;
  }): Promise<{ id: string; matchedAt: Date }> {
    const now = new Date();
    const [match] = await this.db.$transaction([
      this.db.match.create({
        data: {
          userId1: input.userId1,
          userId2: input.userId2,
          matchedBy: input.adminId,
          blurb: input.blurb ?? null,
          cardImageUrl: input.cardImageUrl?.trim() ? input.cardImageUrl.trim() : null,
        },
      }),
      this.db.user.update({
        where: { id: input.userId1 },
        data: { optInStatus: "opted_out", lastMatchedAt: now },
      }),
      this.db.user.update({
        where: { id: input.userId2 },
        data: { optInStatus: "opted_out", lastMatchedAt: now },
      }),
    ]);
    return { id: match.id, matchedAt: match.matchedAt };
  }

  async findUsersForPostMatchEmails(userIds: string[]) {
    return this.db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, phone: true, profile: { select: { fullName: true } } },
    });
  }
}
