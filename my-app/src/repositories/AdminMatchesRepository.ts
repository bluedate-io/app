import type { PrismaClient } from "@/generated/prisma/client";

export class AdminMatchesRepository {
  constructor(private readonly db: PrismaClient) {}

  findActiveMatches() {
    return this.db.match.findMany({
      where: { status: "active" },
      orderBy: { matchedAt: "desc" },
      include: {
        user1: {
          include: {
            profile: { select: { fullName: true, age: true, city: true } },
            photos: { orderBy: { order: "asc" }, take: 1 },
          },
        },
        user2: {
          include: {
            profile: { select: { fullName: true, age: true, city: true } },
            photos: { orderBy: { order: "asc" }, take: 1 },
          },
        },
      },
    });
  }

  async deleteMatch(id: string): Promise<boolean> {
    try {
      await this.db.match.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

