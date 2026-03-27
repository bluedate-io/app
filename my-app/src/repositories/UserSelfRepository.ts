import type { PrismaClient } from "@/generated/prisma/client";

export class UserSelfRepository {
  constructor(private readonly db: PrismaClient) {}

  getProfileBundle(userId: string) {
    return this.db.$transaction([
      this.db.profile.findUnique({
        where: { userId },
        select: { fullName: true, dateOfBirth: true, city: true, bio: true },
      }),
      this.db.preferences.findUnique({
        where: { userId },
        select: {
          genderIdentity: true,
          genderUpdateCount: true,
          genderPreference: true,
          ageRangeMin: true,
          ageRangeMax: true,
          heightCm: true,
          relationshipIntent: true,
          relationshipGoals: true,
        },
      }),
      this.db.interests.findUnique({
        where: { userId },
        select: { hobbies: true, favouriteActivities: true },
      }),
      (this.db.personality as any).findUnique({
        where: { userId },
        select: {
          smokingHabit: true,
          drinkingHabit: true,
          kidsStatus: true,
          kidsPreference: true,
          religion: true,
          politics: true,
        },
      }),
      this.db.photo.findMany({
        where: { userId },
        select: { url: true, order: true },
        orderBy: { order: "asc" },
      }),
    ]);
  }

  findWeeklyOptIn(userId: string, weekStart: Date) {
    return this.db.weeklyOptIn.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      select: { mode: true, description: true, createdAt: true },
    });
  }

  findPreferenceIntent(userId: string) {
    return this.db.preferences.findUnique({
      where: { userId },
      select: { relationshipIntent: true },
    });
  }

  upsertWeeklyOptIn(userId: string, weekStart: Date, mode: string, description?: string) {
    return this.db.weeklyOptIn.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      create: { userId, weekStart, mode, description: description ?? null },
      update: { description: description ?? undefined },
      select: { mode: true, description: true },
    });
  }

  upsertWantDate(userId: string, wantDate: boolean) {
    return this.db.preferences.upsert({
      where: { userId },
      create: { userId, wantDate },
      update: { wantDate },
    });
  }

  updatePhone(userId: string, phone: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { phone },
    });
  }

  findUserBasic(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, onboardingCompleted: true, profile: { select: { fullName: true } } },
    });
  }

  updateOptInStatus(userId: string, optInStatus: "opted_in" | "opted_in_late") {
    return this.db.user.update({
      where: { id: userId },
      data: { optInStatus, optedInAt: new Date() },
    });
  }

  ensureUserRoleAdmin(userId: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { role: "admin" },
    });
  }
}

