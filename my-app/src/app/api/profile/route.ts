// GET /api/profile — return full profile data for the authenticated user
import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/withMiddleware";
import { container } from "@/lib/container";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const userId = ctx.userId;

  const [profile, preferences, interests, personality, photos] = await db.$transaction([
    db.profile.findUnique({
      where: { userId },
      select: { fullName: true, dateOfBirth: true, city: true, bio: true },
    }),
    db.preferences.findUnique({
      where: { userId },
      select: {
        genderIdentity: true,
        genderPreference: true,
        ageRangeMin: true,
        ageRangeMax: true,
        heightCm: true,
        relationshipIntent: true,
        relationshipGoals: true,
      },
    }),
    db.interests.findUnique({
      where: { userId },
      select: { hobbies: true, favouriteActivities: true },
    }),
    (db.personality as any).findUnique({
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
    db.photo.findMany({
      where: { userId },
      select: { url: true, order: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return NextResponse.json({
    data: {
      profile,
      preferences,
      interests,
      personality: personality
        ? {
            ...personality,
            smokingHabit: personality.smokingHabit ?? null,
            drinkingHabit: personality.drinkingHabit ?? null,
          }
        : null,
      photos,
    },
  });
});
