import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import db from "@/lib/db";

function verifyAdmin(req: NextRequest): boolean {
  try {
    const cookie = req.cookies.get("admin_token")?.value;
    if (!cookie) return false;
    const payload = jwt.verify(cookie, config.auth.jwtSecret) as { role?: string };
    return payload.role === "admin";
  } catch {
    return false;
  }
}

type UserRow = {
  id: string;
  profile: { fullName: string | null; age: number | null; city: string | null; bio: string | null } | null;
  preferences: { heightCm: number | null; relationshipIntent: string | null; ageRangeMin: number | null; ageRangeMax: number | null; genderPreference: string[] } | null;
  personality: { religion: string[]; kidsPreference: string | null; kidsStatus: string | null; socialLevel: string | null; conversationStyle: string | null } | null;
  interests: { hobbies: string[]; favouriteActivities: string[] } | null;
  photos: { url: string }[];
};

function shape(u: UserRow) {
  return {
    userId: u.id,
    name: u.profile?.fullName ?? "—",
    age: u.profile?.age ?? null,
    city: u.profile?.city ?? null,
    photoUrl: u.photos[0]?.url ?? null,
    lookingFor: u.preferences?.relationshipIntent ?? null,
    heightCm: u.preferences?.heightCm ?? null,
    ageRange: u.preferences?.ageRangeMin && u.preferences?.ageRangeMax
      ? `${u.preferences.ageRangeMin}–${u.preferences.ageRangeMax}`
      : null,
    interestedIn: u.preferences?.genderPreference ?? [],
    religion: u.personality?.religion ?? [],
    kidsStatus: u.personality?.kidsStatus ?? null,
    kidsPreference: u.personality?.kidsPreference ?? null,
    socialLevel: u.personality?.socialLevel ?? null,
    conversationStyle: u.personality?.conversationStyle ?? null,
    hobbies: u.interests?.hobbies ?? [],
    activities: u.interests?.favouriteActivities ?? [],
    bio: u.profile?.bio ?? null,
  };
}

const include = {
  profile: { select: { fullName: true, age: true, city: true, bio: true } },
  preferences: { select: { heightCm: true, relationshipIntent: true, ageRangeMin: true, ageRangeMax: true, genderPreference: true } },
  personality: { select: { religion: true, kidsPreference: true, kidsStatus: true, socialLevel: true, conversationStyle: true } },
  interests: { select: { hobbies: true, favouriteActivities: true } },
  photos: { orderBy: { order: "asc" as const }, take: 1 },
};

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const activeMatches = await db.match.findMany({
    where: { status: "active" },
    select: { userId1: true, userId2: true },
  });
  const matchedIds = new Set<string>();
  for (const m of activeMatches) {
    matchedIds.add(m.userId1);
    matchedIds.add(m.userId2);
  }

  const [womenRaw, menRaw] = await db.$transaction([
    db.user.findMany({
      where: { onboardingCompleted: true, role: "user", preferences: { wantDate: true, genderIdentity: { in: ["Woman"] } } },
      include,
      orderBy: { createdAt: "asc" },
    }),
    db.user.findMany({
      where: { onboardingCompleted: true, role: "user", preferences: { wantDate: true, genderIdentity: { in: ["Man"] } } },
      include,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const women = womenRaw.filter((u) => !matchedIds.has(u.id)).map(shape);
  const men = menRaw.filter((u) => !matchedIds.has(u.id)).map(shape);

  return NextResponse.json({ data: { women, men } });
}
