// GET /api/admin/match-users/suggestions?userId=xxx
// Returns scored & ranked candidates for the selected opted-in user.
//
// Hard filters:
//   - Opted in this week
//   - Same college as selected user
//   - Candidate's genderPreference includes selected user's genderIdentity (they want them)
//   - Selected user's genderPreference includes candidate's genderIdentity (mutual)
//   - Not already in an active match
//   - No existing AdminSkip for this pair (either direction)
//
// Scoring (soft):
//   - Same mode (date/bff):           +20
//   - Candidate age in user's range:  +15
//   - User age in candidate's range:  +15
//   - Each shared hobby:              +5  (cap 25)
//   - Each shared activity:           +3  (cap 15)
//   - Shared religion:                +10
//   - Same city:                      +8
//   - Same social level:              +5
//   - Same conversation style:        +5

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

const IST_MS = 5.5 * 60 * 60 * 1000;

function getWeekStart(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST_MS);
  const day = ist.getUTCDay();
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const mondayIST = new Date(ist);
  mondayIST.setUTCDate(ist.getUTCDate() + daysToMonday);
  mondayIST.setUTCHours(0, 0, 0, 0);
  return new Date(mondayIST.getTime() - IST_MS);
}

function inRange(value: number | null, min: number | null, max: number | null): boolean {
  if (value == null || min == null || max == null) return false;
  return value >= min && value <= max;
}

function overlap(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => setB.has(x.toLowerCase()));
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: { message: "userId required" } }, { status: 400 });
  }

  const weekStart = getWeekStart();

  // Load selected user's opt-in + full profile
  const selectedOptIn = await db.weeklyOptIn.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
    select: {
      mode: true,
      description: true,
      user: {
        select: {
          collegeName: true,
          profile: { select: { fullName: true, age: true, city: true, bio: true } },
          preferences: {
            select: {
              genderIdentity: true,
              genderPreference: true,
              ageRangeMin: true,
              ageRangeMax: true,
              heightCm: true,
              relationshipIntent: true,
            },
          },
          personality: { select: { religion: true, socialLevel: true, conversationStyle: true, kidsStatus: true, kidsPreference: true } },
          interests: { select: { hobbies: true, favouriteActivities: true } },
          photos: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  });

  if (!selectedOptIn) {
    return NextResponse.json({ error: { message: "User not opted in this week" } }, { status: 404 });
  }

  const sel = selectedOptIn.user;
  const selGender = sel.preferences?.genderIdentity ?? null;
  const selWants = sel.preferences?.genderPreference ?? [];
  const selCollege = sel.collegeName ?? null;

  if (!selCollege) {
    return NextResponse.json({ data: { candidates: [], selectedUser: shapeSelected(userId, selectedOptIn) } });
  }

  // Already matched users
  const activeMatches = await db.match.findMany({
    where: { status: "active" },
    select: { userId1: true, userId2: true },
  });
  const matchedIds = new Set<string>();
  for (const m of activeMatches) {
    matchedIds.add(m.userId1);
    matchedIds.add(m.userId2);
  }

  // Already skipped pairs involving this user
  const skips = await db.adminSkip.findMany({
    where: { OR: [{ userId1: userId }, { userId2: userId }] },
    select: { userId1: true, userId2: true },
  });
  const skippedIds = new Set<string>();
  for (const s of skips) {
    skippedIds.add(s.userId1 === userId ? s.userId2 : s.userId1);
  }

  // All other opted-in users this week from the same college
  const candidateOptIns = await db.weeklyOptIn.findMany({
    where: {
      weekStart,
      userId: { not: userId },
      user: {
        collegeName: selCollege,
        onboardingCompleted: true,
      },
    },
    select: {
      mode: true,
      description: true,
      userId: true,
      user: {
        select: {
          id: true,
          collegeName: true,
          profile: { select: { fullName: true, age: true, city: true, bio: true } },
          preferences: {
            select: {
              genderIdentity: true,
              genderPreference: true,
              ageRangeMin: true,
              ageRangeMax: true,
              heightCm: true,
              relationshipIntent: true,
            },
          },
          personality: { select: { religion: true, socialLevel: true, conversationStyle: true, kidsStatus: true, kidsPreference: true } },
          interests: { select: { hobbies: true, favouriteActivities: true } },
          photos: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  });

  // Hard filter + score
  const scored = [];

  for (const optIn of candidateOptIns) {
    const c = optIn.user;
    const cId = optIn.userId;
    const cGender = c.preferences?.genderIdentity ?? null;
    const cWants = c.preferences?.genderPreference ?? [];

    // Already matched or skipped
    if (matchedIds.has(cId) || skippedIds.has(cId)) continue;

    // Mutual gender preference
    const selWantsCandidate = selGender ? cWants.some((g) => g.toLowerCase() === selGender.toLowerCase()) : false;
    const candidateWantsSel = cGender ? selWants.some((g) => g.toLowerCase() === cGender.toLowerCase()) : false;
    if (!selWantsCandidate || !candidateWantsSel) continue;

    // Score
    const breakdown: { label: string; pts: number }[] = [];

    // Same mode
    if (optIn.mode === selectedOptIn.mode) {
      breakdown.push({ label: "Same intent (date/bff)", pts: 20 });
    }

    // Age compatibility
    const selAge = sel.profile?.age ?? null;
    const cAge = c.profile?.age ?? null;
    const selMin = sel.preferences?.ageRangeMin ?? null;
    const selMax = sel.preferences?.ageRangeMax ?? null;
    const cMin = c.preferences?.ageRangeMin ?? null;
    const cMax = c.preferences?.ageRangeMax ?? null;

    if (inRange(cAge, selMin, selMax)) breakdown.push({ label: "Their age fits your range", pts: 15 });
    if (inRange(selAge, cMin, cMax)) breakdown.push({ label: "Your age fits their range", pts: 15 });

    // Shared hobbies
    const selHobbies = sel.interests?.hobbies ?? [];
    const cHobbies = c.interests?.hobbies ?? [];
    const sharedHobbies = overlap(selHobbies, cHobbies);
    if (sharedHobbies.length > 0) {
      breakdown.push({ label: `Shared hobbies: ${sharedHobbies.slice(0, 3).join(", ")}`, pts: Math.min(5 * sharedHobbies.length, 25) });
    }

    // Shared activities
    const selActs = sel.interests?.favouriteActivities ?? [];
    const cActs = c.interests?.favouriteActivities ?? [];
    const sharedActs = overlap(selActs, cActs);
    if (sharedActs.length > 0) {
      breakdown.push({ label: `Shared activities: ${sharedActs.slice(0, 3).join(", ")}`, pts: Math.min(3 * sharedActs.length, 15) });
    }

    // Shared religion
    const selRel = sel.personality?.religion ?? [];
    const cRel = c.personality?.religion ?? [];
    if (overlap(selRel, cRel).length > 0) {
      breakdown.push({ label: "Same religion", pts: 10 });
    }

    // Same city
    if (sel.profile?.city && c.profile?.city && sel.profile.city.toLowerCase() === c.profile.city.toLowerCase()) {
      breakdown.push({ label: "Same city", pts: 8 });
    }

    // Social level
    if (sel.personality?.socialLevel && c.personality?.socialLevel && sel.personality.socialLevel === c.personality.socialLevel) {
      breakdown.push({ label: "Same social energy", pts: 5 });
    }

    // Conversation style
    if (sel.personality?.conversationStyle && c.personality?.conversationStyle && sel.personality.conversationStyle === c.personality.conversationStyle) {
      breakdown.push({ label: "Same conversation style", pts: 5 });
    }

    const score = breakdown.reduce((s, b) => s + b.pts, 0);

    scored.push({
      userId: cId,
      name: c.profile?.fullName ?? "—",
      age: c.profile?.age ?? null,
      city: c.profile?.city ?? null,
      bio: c.profile?.bio ?? null,
      photoUrl: c.photos[0]?.url ?? null,
      collegeName: c.collegeName ?? null,
      genderIdentity: cGender,
      genderPreference: cWants,
      mode: optIn.mode,
      description: optIn.description ?? null,
      lookingFor: c.preferences?.relationshipIntent ?? null,
      heightCm: c.preferences?.heightCm ?? null,
      ageRange: cMin && cMax ? `${cMin}–${cMax}` : null,
      interestedIn: cWants,
      religion: cRel,
      kidsStatus: c.personality?.kidsStatus ?? null,
      kidsPreference: c.personality?.kidsPreference ?? null,
      socialLevel: c.personality?.socialLevel ?? null,
      conversationStyle: c.personality?.conversationStyle ?? null,
      hobbies: cHobbies,
      activities: cActs,
      score,
      scoreBreakdown: breakdown,
    });
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return NextResponse.json({ data: { candidates: scored, selectedUser: shapeSelected(userId, selectedOptIn) } });
}

function shapeSelected(userId: string, optIn: {
  mode: string;
  description: string | null;
  user: {
    collegeName: string | null;
    profile: { fullName: string | null; age: number | null; city: string | null; bio: string | null } | null;
    preferences: { genderIdentity: string | null; genderPreference: string[]; ageRangeMin: number | null; ageRangeMax: number | null; heightCm: number | null; relationshipIntent: string | null } | null;
    personality: { religion: string[]; socialLevel: string | null; conversationStyle: string | null; kidsStatus: string | null; kidsPreference: string | null } | null;
    interests: { hobbies: string[]; favouriteActivities: string[] } | null;
    photos: { url: string }[];
  };
}) {
  const u = optIn.user;
  const p = u.preferences;
  return {
    userId,
    name: u.profile?.fullName ?? "—",
    age: u.profile?.age ?? null,
    city: u.profile?.city ?? null,
    bio: u.profile?.bio ?? null,
    photoUrl: u.photos[0]?.url ?? null,
    collegeName: u.collegeName ?? null,
    genderIdentity: p?.genderIdentity ?? null,
    genderPreference: p?.genderPreference ?? [],
    mode: optIn.mode,
    description: optIn.description ?? null,
    lookingFor: p?.relationshipIntent ?? null,
    heightCm: p?.heightCm ?? null,
    ageRange: p?.ageRangeMin && p?.ageRangeMax ? `${p.ageRangeMin}–${p.ageRangeMax}` : null,
    interestedIn: p?.genderPreference ?? [],
    religion: u.personality?.religion ?? [],
    kidsStatus: u.personality?.kidsStatus ?? null,
    kidsPreference: u.personality?.kidsPreference ?? null,
    socialLevel: u.personality?.socialLevel ?? null,
    conversationStyle: u.personality?.conversationStyle ?? null,
    hobbies: u.interests?.hobbies ?? [],
    activities: u.interests?.favouriteActivities ?? [],
  };
}
