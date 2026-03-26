// ─── GET /api/admin/match/candidates ─────────────────────────────────────────
// Returns all User B candidates for a given User A, sorted same-city first.
// Excludes pairs already matched.
//
// Query params:
//   userId   — required, User A's id
//   city     — comma-separated city names (filter)
//   college  — comma-separated college names (filter)
//   ageMin   — minimum age (inclusive)
//   ageMax   — maximum age (inclusive)

import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import type { Prisma } from "@/generated/prisma/client";
import { config } from "@/config";
import db from "@/lib/db";

function getAdminId(req: NextRequest): string | null {
  try {
    const cookie = req.cookies.get("admin_token")?.value;
    if (!cookie) return null;
    const payload = jwt.verify(cookie, config.auth.jwtSecret) as { role?: string; sub?: string };
    return payload.role === "admin" ? (payload.sub ?? null) : null;
  } catch {
    return null;
  }
}

function parseCsv(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function GET(req: NextRequest) {
  if (!getAdminId(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const userId = sp.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Fetch User A to get gender and city for sorting
  const userA = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: { select: { city: true } },
      preferences: { select: { genderIdentity: true } },
    },
  });
  if (!userA) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userAGender = userA.preferences?.genderIdentity ?? null;
  const userACity = userA.profile?.city ?? null;

  const cities = parseCsv(sp.get("city"));
  const colleges = parseCsv(sp.get("college"));
  const ageMin = parseInt(sp.get("ageMin") ?? "", 10);
  const ageMax = parseInt(sp.get("ageMax") ?? "", 10);

  // Build where for candidates
  const and: Prisma.UserWhereInput[] = [
    { id: { not: userId } },
    { role: { not: "admin" } },
    { onboardingCompleted: true },
    { optInStatus: { in: ["opted_in", "opted_in_late"] } },
  ];

  // Must be opposite gender
  if (userAGender) {
    and.push({ preferences: { is: { genderIdentity: { not: userAGender } } } });
  }

  if (cities.length > 0) and.push({ profile: { is: { city: { in: cities } } } });
  if (colleges.length > 0) and.push({ collegeName: { in: colleges } });
  if (!isNaN(ageMin)) and.push({ profile: { is: { age: { gte: ageMin } } } });
  if (!isNaN(ageMax)) and.push({ profile: { is: { age: { lte: ageMax } } } });

  const candidates = await db.user.findMany({
    where: { AND: and },
    include: {
      profile: { select: { fullName: true, age: true, city: true, bio: true } },
      preferences: { select: { genderIdentity: true } },
      aiSignals: { select: { selfDescription: true, idealPartner: true } },
      photos: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
    },
  });

  // Exclude already-matched pairs
  const candidateIds = candidates.map((c) => c.id);
  const existingMatches = await db.match.findMany({
    where: {
      status: "active",
      OR: [
        { userId1: userId, userId2: { in: candidateIds } },
        { userId2: userId, userId1: { in: candidateIds } },
      ],
    },
    select: { userId1: true, userId2: true },
  });
  const matchedIds = new Set<string>();
  for (const m of existingMatches) {
    if (m.userId1 === userId) matchedIds.add(m.userId2);
    else matchedIds.add(m.userId1);
  }

  const filtered = candidates.filter((c) => !matchedIds.has(c.id));

  // Sort: same city as User A first
  filtered.sort((a, b) => {
    const aMatch = a.profile?.city === userACity && userACity != null;
    const bMatch = b.profile?.city === userACity && userACity != null;
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  const result = filtered.map((c) => ({
    id: c.id,
    name: c.profile?.fullName ?? "—",
    age: c.profile?.age ?? null,
    city: c.profile?.city ?? null,
    college: c.collegeName ?? null,
    gender: c.preferences?.genderIdentity ?? null,
    selfDescription: c.aiSignals?.selfDescription ?? c.profile?.bio ?? null,
    idealPartner: c.aiSignals?.idealPartner ?? null,
    photoUrl: c.photos[0]?.url ?? null,
  }));

  return NextResponse.json({ data: result });
}
