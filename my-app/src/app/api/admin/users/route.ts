import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import db from "@/lib/db";
import { computeAdminUserStep } from "@/lib/adminUserStep";

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

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const completed = req.nextUrl.searchParams.get("completed");

  const onboardingWhere =
    completed === "true"
      ? { onboardingCompleted: true }
      : completed === "false"
        ? { onboardingCompleted: false }
        : {};

  const users = await db.user.findMany({
    where: {
      role: { not: "admin" },
      ...onboardingWhere,
    },
    include: {
      profile: { select: { fullName: true, city: true, dateOfBirth: true } },
      preferences: { select: { genderIdentity: true, id: true } },
      interests: { select: { id: true } },
      personality: { select: { id: true } },
      _count: { select: { photos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = users.map((u) => ({
      id: u.id,
      phone: u.phone,
      name: u.profile?.fullName ?? "—",
      city: u.profile?.city ?? "—",
      gender: u.preferences?.genderIdentity ?? "—",
      step: computeAdminUserStep(u),
      completed: u.onboardingCompleted,
      joinedAt: u.createdAt.toISOString(),
    }));

  return NextResponse.json({ data });
}
