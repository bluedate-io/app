import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
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

export async function POST(req: NextRequest) {
  const adminId = getAdminId(req);
  if (!adminId) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { userId1, userId2 } = await req.json();
  if (!userId1 || !userId2) {
    return NextResponse.json({ error: { message: "userId1 and userId2 required" } }, { status: 400 });
  }

  await db.adminSkip.upsert({
    where: { userId1_userId2: { userId1, userId2 } },
    create: { userId1, userId2, skippedBy: adminId },
    update: { skippedBy: adminId, skippedAt: new Date() },
  });

  return NextResponse.json({ data: { skipped: true } });
}
