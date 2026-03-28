// Profile edit page — Server Component
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { db } from "@/lib/db";
import { EditFieldView } from "./EditFieldView";
import type { ProfileData } from "../../page";

const VALID_FIELDS = [
  "basics",
  "photos",
  "interests",
  "gender",
  "relationship-intent",
  "gender-preference",
  "looking-for",
  "height",
  "drinking",
  "religion",
  "family",
] as const;

export type EditField = (typeof VALID_FIELDS)[number];

export default async function EditFieldPage({
  params,
}: {
  params: Promise<{ field: string }>;
}) {
  const { field } = await params;
  if (!VALID_FIELDS.includes(field as EditField)) redirect("/profile");

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = { profile, preferences, interests, personality, photos } as any as ProfileData;
  return <EditFieldView field={field as EditField} data={data} />;
}
