// GET /api/admin/match-users/opted-in?page=1&limit=20
// Returns paginated list of users who opted in this week and are not already matched.

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

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const weekStart = getWeekStart();

  // Users already in an active match
  const activeMatches = await db.match.findMany({
    where: { status: "active" },
    select: { userId1: true, userId2: true },
  });
  const matchedIds = new Set<string>();
  for (const m of activeMatches) {
    matchedIds.add(m.userId1);
    matchedIds.add(m.userId2);
  }

  // All opted-in records for this week
  const allOptIns = await db.weeklyOptIn.findMany({
    where: { weekStart },
    select: {
      userId: true,
      mode: true,
      description: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          collegeName: true,
          onboardingCompleted: true,
          profile: { select: { fullName: true, age: true, city: true } },
          preferences: { select: { genderIdentity: true, genderPreference: true } },
          photos: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Filter out already-matched and incomplete onboarding
  const eligible = allOptIns.filter(
    (o) => o.user.onboardingCompleted && !matchedIds.has(o.userId),
  );

  const total = eligible.length;
  const page_items = eligible.slice(skip, skip + limit);

  const users = page_items.map((o) => ({
    userId: o.userId,
    name: o.user.profile?.fullName ?? "—",
    age: o.user.profile?.age ?? null,
    city: o.user.profile?.city ?? null,
    photoUrl: o.user.photos[0]?.url ?? null,
    collegeName: o.user.collegeName ?? null,
    genderIdentity: o.user.preferences?.genderIdentity ?? null,
    genderPreference: o.user.preferences?.genderPreference ?? [],
    mode: o.mode,
    description: o.description ?? null,
    optedInAt: o.createdAt.toISOString(),
  }));

  return NextResponse.json({ data: { users, total, page, limit, pages: Math.ceil(total / limit) } });
}
