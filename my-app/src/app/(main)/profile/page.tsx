// ─── Profile page — Server Component ─────────────────────────────────────────
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { db } from "@/lib/db";
import { ProfileView } from "./ProfileView";

export interface ProfileData {
  profile: {
    fullName?: string;
    dateOfBirth?: string;
    city?: string;
    bio?: string;
  } | null;
  preferences: {
    genderIdentity?: string;
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
    socialLevel?: string;
    conversationStyle?: string;
    kidsStatus?: string;
    kidsPreference?: string;
    religion?: string[];
    politics?: string[];
  } | null;
  photos: { url: string; order: number }[];
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
        socialLevel: true,
        conversationStyle: true,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = { profile, preferences, interests, personality, photos } as any as ProfileData;
  return <ProfileView data={data} />;
}
