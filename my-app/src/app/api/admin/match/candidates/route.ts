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

function normalizeGender(v: string): "Woman" | "Man" | "Nonbinary" | null {
  const s = v.trim().toLowerCase();
  if (s === "woman" || s === "women") return "Woman";
  if (s === "man" || s === "men") return "Man";
  if (s === "nonbinary" || s === "non-binary" || s === "nb") return "Nonbinary";
  return null;
}

function expandGenderValues(list: string[]): string[] {
  const out: string[] = [];
  for (const raw of list) {
    const g = normalizeGender(raw);
    if (!g) continue;
    if (g === "Woman") out.push("Woman", "woman", "Women", "women");
    if (g === "Man") out.push("Man", "man", "Men", "men");
    if (g === "Nonbinary") out.push("Nonbinary", "nonbinary", "Non-binary", "non-binary");
  }
  return Array.from(new Set(out));
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

  if (!userAGender) {
    return NextResponse.json(
      { error: "User A must have genderIdentity to find opposite-gender candidates" },
      { status: 400 },
    );
  }

  const cities = parseCsv(sp.get("city"));
  const colleges = parseCsv(sp.get("college"));
  const genderFilterRaw = parseCsv(sp.get("gender"));
  const ageMin = parseInt(sp.get("ageMin") ?? "", 10);
  const ageMax = parseInt(sp.get("ageMax") ?? "", 10);

  // Build where for candidates
  const and: Prisma.UserWhereInput[] = [
    { id: { not: userId } },
    { role: { not: "admin" } },
    { onboardingCompleted: true },
    { optInStatus: { in: ["opted_in", "opted_in_late"] } },
  ];

  // Gender filtering:
  // - If admin provided `gender` filter, use it (override opposite-gender rule).
  // - Otherwise, default to opposite gender of User A.
  if (genderFilterRaw.length > 0) {
    const allowed = expandGenderValues(genderFilterRaw);
    if (allowed.length === 0) {
      return NextResponse.json({ error: "Invalid gender filter" }, { status: 400 });
    }
    and.push({ preferences: { is: { genderIdentity: { in: allowed } } } });
  } else {
    const aGenderNorm = String(userAGender).trim().toLowerCase();
    const oppositeGenderValues =
      aGenderNorm === "man"
        ? ["Woman", "woman", "Women", "women"]
        : aGenderNorm === "woman"
          ? ["Man", "man", "Men", "men"]
          : [];
    if (oppositeGenderValues.length === 0) {
      return NextResponse.json(
        { error: `Unsupported genderIdentity for opposite-gender matching: ${userAGender}` },
        { status: 400 },
      );
    }
    and.push({ preferences: { is: { genderIdentity: { in: oppositeGenderValues } } } });
  }

  if (cities.length > 0) and.push({ profile: { is: { city: { in: cities } } } });
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
    and.push(domainOr.length > 0 ? { OR: domainOr } : { id: { equals: "__no_match__" } });
  }
  if (!isNaN(ageMin)) and.push({ profile: { is: { age: { gte: ageMin } } } });
  if (!isNaN(ageMax)) and.push({ profile: { is: { age: { lte: ageMax } } } });

  const collegeDomains = await db.collegeDomain.findMany({
    select: { domain: true, collegeName: true },
  });
  const collegeByDomain = new Map<string, string>();
  for (const cd of collegeDomains) {
    const d = cd.domain?.trim().toLowerCase();
    if (!d) continue;
    collegeByDomain.set(d, cd.collegeName);
  }

  const candidates = await db.user.findMany({
    where: { AND: and },
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

  const result = filtered.map((c) => {
    const derivedCollege = c.email ? collegeByDomain.get(emailDomain(c.email) ?? "") ?? null : null;

    return {
      id: c.id,
      name: c.profile?.fullName ?? "—",
      age: c.profile?.age ?? null,
      city: c.profile?.city ?? null,
      college: derivedCollege,
      gender: c.preferences?.genderIdentity ?? null,
      selfDescription: c.aiSignals?.selfDescription ?? c.profile?.bio ?? null,
      idealPartner: c.aiSignals?.idealPartner ?? null,
      nickname: c.profile?.nickname ?? null,
      dateOfBirth: c.profile?.dateOfBirth ?? null,
      bio: c.profile?.bio ?? null,
      onboardingCompleted: c.onboardingCompleted,
      optInStatus: c.optInStatus,
      optedInAt: c.optedInAt ?? null,
      genderPreference: c.preferences?.genderPreference ?? [],
      ageRangeMin: c.preferences?.ageRangeMin ?? null,
      ageRangeMax: c.preferences?.ageRangeMax ?? null,
      relationshipIntent: c.preferences?.relationshipIntent ?? null,
      relationshipGoals: c.preferences?.relationshipGoals ?? [],
      heightCm: c.preferences?.heightCm ?? null,
      heightCompleted: c.preferences?.heightCompleted ?? false,
      wantDate: c.preferences?.wantDate ?? null,
      datingModeCompleted: c.preferences?.datingModeCompleted ?? false,
      photosStepCompleted: c.preferences?.photosStepCompleted ?? false,
      hobbies: c.interests?.hobbies ?? [],
      favouriteActivities: c.interests?.favouriteActivities ?? [],
      musicTaste: c.interests?.musicTaste ?? [],
      foodTaste: c.interests?.foodTaste ?? [],
      bffInterests: c.interests?.bffInterests ?? [],
      bffInterestsCompleted: c.interests?.bffInterestsCompleted ?? false,
      smokingHabit: c.personality?.smokingHabit ?? null,
      drinkingHabit: c.personality?.drinkingHabit ?? null,
      funFact: c.personality?.funFact ?? null,
      kidsStatus: c.personality?.kidsStatus ?? null,
      kidsPreference: c.personality?.kidsPreference ?? null,
      religion: c.personality?.religion ?? [],
      politics: c.personality?.politics ?? [],
      importantLifeCompleted: c.personality?.importantLifeCompleted ?? false,
      familyPlansCompleted: c.personality?.familyPlansCompleted ?? false,
      lifeExperiences: c.personality?.lifeExperiences ?? [],
      lifeExperiencesCompleted: c.personality?.lifeExperiencesCompleted ?? false,
      relationshipStatus: c.personality?.relationshipStatus ?? null,
      relationshipStatusCompleted: c.personality?.relationshipStatusCompleted ?? false,
      availabilityDays: c.availability?.days ?? [],
      availabilityTimes: c.availability?.times ?? [],
      idealDate: c.aiSignals?.idealDate ?? null,
      weeklyOptIns: c.weeklyOptIns,
      photoUrl: c.photos[0]?.url ?? null,
    };
  });

  return NextResponse.json({ data: result });
}
