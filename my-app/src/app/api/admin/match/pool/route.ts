// ─── GET /api/admin/match/pool ────────────────────────────────────────────────
// Returns opted-in, onboarding-complete users for the User A pool.
// For each pool user, includes a `candidateCount` (opposite-gender opted-in
// users not already matched with them, within the same filters).
//
// Query params:
//   gender   — filter User A pool by gender ("Man" | "Woman" | "Nonbinary")
//   city     — comma-separated city names
//   college  — comma-separated college names
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
  const gender = sp.get("gender") ?? "";
  const cities = parseCsv(sp.get("city"));
  const colleges = parseCsv(sp.get("college"));
  const ageMin = parseInt(sp.get("ageMin") ?? "", 10);
  const ageMax = parseInt(sp.get("ageMax") ?? "", 10);

  // Base filter: opted-in, onboarding complete, not admin
  const baseAnd: Prisma.UserWhereInput[] = [
    { role: { not: "admin" } },
    { onboardingCompleted: true },
    { optInStatus: { in: ["opted_in", "opted_in_late"] } },
  ];

  if (cities.length > 0) baseAnd.push({ profile: { is: { city: { in: cities } } } });
  if (colleges.length > 0) baseAnd.push({ collegeName: { in: colleges } });
  if (!isNaN(ageMin)) baseAnd.push({ profile: { is: { age: { gte: ageMin } } } });
  if (!isNaN(ageMax)) baseAnd.push({ profile: { is: { age: { lte: ageMax } } } });

  // Fetch all opted-in users matching the base filters (both genders)
  const allUsers = await db.user.findMany({
    where: { AND: baseAnd },
    include: {
      profile: { select: { fullName: true, age: true, city: true, bio: true } },
      preferences: { select: { genderIdentity: true } },
      aiSignals: { select: { selfDescription: true, idealPartner: true } },
      photos: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
    },
  });

  // Fetch existing active matches among these users to exclude already-matched pairs
  const userIds = allUsers.map((u) => u.id);
  const existingMatches = await db.match.findMany({
    where: {
      status: "active",
      OR: [{ userId1: { in: userIds } }, { userId2: { in: userIds } }],
    },
    select: { userId1: true, userId2: true },
  });

  const matchedWith = new Map<string, Set<string>>();
  for (const m of existingMatches) {
    if (!matchedWith.has(m.userId1)) matchedWith.set(m.userId1, new Set());
    if (!matchedWith.has(m.userId2)) matchedWith.set(m.userId2, new Set());
    matchedWith.get(m.userId1)!.add(m.userId2);
    matchedWith.get(m.userId2)!.add(m.userId1);
  }

  // Split by pool gender filter
  const poolUsers = gender
    ? allUsers.filter((u) => u.preferences?.genderIdentity === gender)
    : allUsers;
  const oppositeUsers = gender
    ? allUsers.filter((u) => u.preferences?.genderIdentity !== gender)
    : allUsers;

  const result = poolUsers.map((u) => {
    const alreadyMatched = matchedWith.get(u.id) ?? new Set();
    const candidateCount = oppositeUsers.filter(
      (c) => c.id !== u.id && !alreadyMatched.has(c.id),
    ).length;

    return {
      id: u.id,
      name: u.profile?.fullName ?? "—",
      age: u.profile?.age ?? null,
      city: u.profile?.city ?? null,
      college: u.collegeName ?? null,
      gender: u.preferences?.genderIdentity ?? null,
      selfDescription: u.aiSignals?.selfDescription ?? u.profile?.bio ?? null,
      idealPartner: u.aiSignals?.idealPartner ?? null,
      candidateCount,
      photoUrl: u.photos[0]?.url ?? null,
    };
  });

  return NextResponse.json({ data: result });
}
