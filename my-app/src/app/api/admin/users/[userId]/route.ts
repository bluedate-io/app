import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import db from "@/lib/db";

function verifyAdminToken(req: NextRequest): boolean {
  try {
    const cookie = req.cookies.get("admin_token")?.value;
    if (!cookie) return false;
    const payload = jwt.verify(cookie, config.auth.jwtSecret) as { role?: string };
    return payload.role === "admin";
  } catch {
    return false;
  }
}

function calcAge(dob: Date | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: { message: "Missing user id" } }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      preferences: true,
      interests: true,
      personality: true,
      photos: { orderBy: { order: "asc" } },
    },
  });

  if (!user || user.role === "admin") {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }

  const hobbies =
    user.interests?.hobbies?.filter((h) => h && h !== "Not specified") ?? [];
  const goals = user.preferences?.relationshipGoals?.filter(Boolean) ?? [];
  const religionList = user.personality?.religion?.filter(Boolean) ?? [];

  const payload = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    collegeName: user.collegeName,
    photoUrl: user.photos[0]?.url ?? null,
    name: user.profile?.fullName ?? null,
    nickname: user.profile?.nickname ?? null,
    city: user.profile?.city ?? null,
    age: calcAge(user.profile?.dateOfBirth ?? null),
    gender: user.preferences?.genderIdentity ?? null,
    interests: hobbies,
    lookingFor: goals.length ? goals.join(", ") : null,
    heightCm: user.preferences?.heightCm ?? null,
    smokingHabit: user.personality?.smokingHabit ?? null,
    drinkingHabit: user.personality?.drinkingHabit ?? null,
    // Backward compatibility for existing consumers
    smoking: user.personality?.smokingHabit ?? null,
    drinking: user.personality?.drinkingHabit ?? null,
    religion: religionList.length ? religionList.join(", ") : null,
    familyPlans: user.personality?.kidsStatus ?? null,
    kidsPreference: user.personality?.kidsPreference ?? null,
  };

  return NextResponse.json({ data: payload });
}
