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

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const matches = await db.match.findMany({
    where: { status: "active" },
    orderBy: { matchedAt: "desc" },
    include: {
      user1: {
        include: {
          profile: { select: { fullName: true, age: true, city: true } },
          photos: { orderBy: { order: "asc" }, take: 1 },
        },
      },
      user2: {
        include: {
          profile: { select: { fullName: true, age: true, city: true } },
          photos: { orderBy: { order: "asc" }, take: 1 },
        },
      },
    },
  });

  const data = matches.map((m) => ({
    id: m.id,
    matchedAt: m.matchedAt.toISOString(),
    blurb: m.blurb ?? null,
    woman: {
      name: m.user1.profile?.fullName ?? "—",
      age: m.user1.profile?.age ?? null,
      city: m.user1.profile?.city ?? null,
      photoUrl: m.user1.photos[0]?.url ?? null,
    },
    man: {
      name: m.user2.profile?.fullName ?? "—",
      age: m.user2.profile?.age ?? null,
      city: m.user2.profile?.city ?? null,
      photoUrl: m.user2.photos[0]?.url ?? null,
    },
  }));

  return NextResponse.json({ data });
}
