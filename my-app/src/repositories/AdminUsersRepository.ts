import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export class AdminUsersRepository {
  constructor(private readonly db: PrismaClient) {}

  findUsers(where: Prisma.UserWhereInput) {
    return this.db.user.findMany({
      where,
      include: {
        profile: { select: { fullName: true, city: true, dateOfBirth: true } },
        preferences: { select: { genderIdentity: true, id: true } },
        interests: { select: { id: true } },
        personality: { select: { id: true } },
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findUserById(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
        interests: true,
        personality: true,
        photos: { orderBy: { order: "asc" } },
      },
    });
  }

  findAllCollegeDomains() {
    return this.db.collegeDomain.findMany();
  }

  findUsersForExport(where: Prisma.UserWhereInput, orderBy: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[]) {
    return this.db.user.findMany({
      where,
      include: {
        profile: {
          select: { fullName: true, nickname: true, dateOfBirth: true, age: true, city: true, bio: true },
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
            wantDate: true,
          },
        },
        interests: {
          select: {
            id: true,
            hobbies: true,
            favouriteActivities: true,
            musicTaste: true,
            foodTaste: true,
          },
        },
        personality: {
          select: {
            id: true,
            smokingHabit: true,
            drinkingHabit: true,
            funFact: true,
            kidsStatus: true,
            kidsPreference: true,
            religion: true,
            politics: true,
            relationshipStatus: true,
          },
        },
        availability: { select: { days: true, times: true } },
        photos: { select: { url: true }, orderBy: { order: "asc" } },
        _count: { select: { photos: true } },
      },
      orderBy,
    });
  }
}

