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

function emailDomain(email?: string | null): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at <= -1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return domain ? domain : null;
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

  // College filter can match either:
  // - User.collegeName (already stored), OR
  // - User.email domain mapped via college_domains
  if (colleges.length > 0) {
    const domains = await db.collegeDomain.findMany({
      where: { collegeName: { in: colleges } },
      select: { domain: true },
    });
    const domainOr: Prisma.UserWhereInput[] = domains
      .map((d) => (d.domain ? d.domain.trim().toLowerCase() : ""))
      .filter(Boolean)
      .map((d) => ({ email: { endsWith: `@${d}` } }));

    // College filtering is based only on email-domain mapping.
    baseAnd.push(domainOr.length > 0 ? { OR: domainOr } : { id: { equals: "__no_match__" } });
  }
  if (!isNaN(ageMin)) baseAnd.push({ profile: { is: { age: { gte: ageMin } } } });
  if (!isNaN(ageMax)) baseAnd.push({ profile: { is: { age: { lte: ageMax } } } });

  // Preload college domain map so `college` always resolves correctly.
  const collegeDomains = await db.collegeDomain.findMany({
    select: { domain: true, collegeName: true },
  });
  const collegeByDomain = new Map<string, string>();
  for (const cd of collegeDomains) {
    const d = cd.domain?.trim().toLowerCase();
    if (!d) continue;
    collegeByDomain.set(d, cd.collegeName);
  }

  // Fetch all opted-in users matching the base filters (both genders)
  const allUsers = await db.user.findMany({
    where: { AND: baseAnd },
    include: {
      profile: {
        select: {
          fullName: true,
          nickname: true,
          dateOfBirth: true,
          age: true,
          city: true,
          bio: true,
        },
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
          heightCompleted: true,
          wantDate: true,
          datingModeCompleted: true,
          photosStepCompleted: true,
        },
      },
      interests: {
        select: {
          hobbies: true,
          favouriteActivities: true,
          musicTaste: true,
          foodTaste: true,
          bffInterests: true,
          bffInterestsCompleted: true,
        },
      },
      personality: {
        select: {
          smokingHabit: true,
          drinkingHabit: true,
          funFact: true,
          kidsStatus: true,
          kidsPreference: true,
          religion: true,
          politics: true,
          importantLifeCompleted: true,
          familyPlansCompleted: true,
          lifeExperiences: true,
          lifeExperiencesCompleted: true,
          relationshipStatus: true,
          relationshipStatusCompleted: true,
        },
      },
      availability: { select: { days: true, times: true } },
      aiSignals: { select: { selfDescription: true, idealPartner: true, idealDate: true } },
      weeklyOptIns: {
        select: { weekStart: true, mode: true, description: true, createdAt: true },
        orderBy: { weekStart: "desc" },
        take: 3,
      },
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
  const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
  const gNorm = norm(gender);
  const poolUsers = gender
    ? allUsers.filter((u) => norm(u.preferences?.genderIdentity) === gNorm)
    : allUsers;
  const oppositeUsers = gender
    ? allUsers.filter((u) => norm(u.preferences?.genderIdentity) !== gNorm)
    : allUsers;

  const result = poolUsers.map((u) => {
    const alreadyMatched = matchedWith.get(u.id) ?? new Set();
    const candidateCount = oppositeUsers.filter(
      (c) => c.id !== u.id && !alreadyMatched.has(c.id),
    ).length;

    const derivedCollege = u.email ? collegeByDomain.get(emailDomain(u.email) ?? "") ?? null : null;

    return {
      id: u.id,
      name: u.profile?.fullName ?? "—",
      age: u.profile?.age ?? null,
      city: u.profile?.city ?? null,
      college: derivedCollege,
      gender: u.preferences?.genderIdentity ?? null,
      selfDescription: u.aiSignals?.selfDescription ?? u.profile?.bio ?? null,
      idealPartner: u.aiSignals?.idealPartner ?? null,
      nickname: u.profile?.nickname ?? null,
      dateOfBirth: u.profile?.dateOfBirth ?? null,
      bio: u.profile?.bio ?? null,
      onboardingCompleted: u.onboardingCompleted,
      optInStatus: u.optInStatus,
      optedInAt: u.optedInAt ?? null,
      genderPreference: u.preferences?.genderPreference ?? [],
      ageRangeMin: u.preferences?.ageRangeMin ?? null,
      ageRangeMax: u.preferences?.ageRangeMax ?? null,
      relationshipIntent: u.preferences?.relationshipIntent ?? null,
      relationshipGoals: u.preferences?.relationshipGoals ?? [],
      heightCm: u.preferences?.heightCm ?? null,
      heightCompleted: u.preferences?.heightCompleted ?? false,
      wantDate: u.preferences?.wantDate ?? null,
      datingModeCompleted: u.preferences?.datingModeCompleted ?? false,
      photosStepCompleted: u.preferences?.photosStepCompleted ?? false,
      hobbies: u.interests?.hobbies ?? [],
      favouriteActivities: u.interests?.favouriteActivities ?? [],
      musicTaste: u.interests?.musicTaste ?? [],
      foodTaste: u.interests?.foodTaste ?? [],
      bffInterests: u.interests?.bffInterests ?? [],
      bffInterestsCompleted: u.interests?.bffInterestsCompleted ?? false,
      smokingHabit: u.personality?.smokingHabit ?? null,
      drinkingHabit: u.personality?.drinkingHabit ?? null,
      funFact: u.personality?.funFact ?? null,
      kidsStatus: u.personality?.kidsStatus ?? null,
      kidsPreference: u.personality?.kidsPreference ?? null,
      religion: u.personality?.religion ?? [],
      politics: u.personality?.politics ?? [],
      importantLifeCompleted: u.personality?.importantLifeCompleted ?? false,
      familyPlansCompleted: u.personality?.familyPlansCompleted ?? false,
      lifeExperiences: u.personality?.lifeExperiences ?? [],
      lifeExperiencesCompleted: u.personality?.lifeExperiencesCompleted ?? false,
      relationshipStatus: u.personality?.relationshipStatus ?? null,
      relationshipStatusCompleted: u.personality?.relationshipStatusCompleted ?? false,
      availabilityDays: u.availability?.days ?? [],
      availabilityTimes: u.availability?.times ?? [],
      idealDate: u.aiSignals?.idealDate ?? null,
      weeklyOptIns: u.weeklyOptIns,
      candidateCount,
      photoUrl: u.photos[0]?.url ?? null,
    };
  });

  return NextResponse.json({ data: result });
}
