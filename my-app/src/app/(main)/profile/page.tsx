// ─── Profile page — Server Component ─────────────────────────────────────────
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { container } from "@/lib/container";
import { db } from "@/lib/db";
import { ProfileView } from "./ProfileView";

export interface SubscriptionData {
  status: string;
  startedAt: Date | null;
  nextBillingAt: Date | null;
  createdAt: Date;
}

export interface ProfileData {
  planType: "basic" | "vip";
  subscription: SubscriptionData | null;
  profile: {
    fullName?: string;
    dateOfBirth?: string;
    city?: string;
    bio?: string;
  } | null;
  preferences: {
    genderIdentity?: string;
    genderUpdateCount?: number;
    genderPreference?: string[];
    ageRangeMin?: number;
    ageRangeMax?: number;
    heightCm?: number;
    relationshipIntent?: string;
    relationshipGoals?: string[];
  } | null;
  interests: {
    hobbies?: string[];
    favouriteActivities?: string[];
  } | null;
  personality: {
    smokingHabit?: string;
    drinkingHabit?: string;
    kidsStatus?: string;
    kidsPreference?: string;
    religion?: string[];
    politics?: string[];
  } | null;
  photos: { id: string; url: string; order: number }[];
}

export default async function ProfilePage() {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/login");

  const secret = new TextEncoder().encode(config.auth.jwtSecret);
  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = payload.sub as string;
  } catch {
    redirect("/login");
  }

  const plan = await container.planAccessService.getEffectivePlan(userId);
  const [subscription, profile, preferences, interests, personality, photos] = await db.$transaction([
    db.subscription.findUnique({
      where: { userId },
      select: { status: true, startedAt: true, nextBillingAt: true, createdAt: true },
    }),
    db.profile.findUnique({
      where: { userId },
      select: { fullName: true, dateOfBirth: true, city: true, bio: true },
    }),
    db.preferences.findUnique({
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
      select: { id: true, url: true, order: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const normalizedPersonality = personality
    ? {
        ...personality,
        smokingHabit: personality.smokingHabit,
        drinkingHabit: personality.drinkingHabit,
      }
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = {
    planType: plan.planType,
    subscription: subscription ?? null,
    profile,
    preferences,
    interests,
    personality: normalizedPersonality,
    photos,
  } as any as ProfileData;
  return <ProfileView data={data} />;
}
