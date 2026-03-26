// ─── POST /api/admin/match/create ─────────────────────────────────────────────
// Creates a match between two users from the admin matchmaking page.
// Body: { userAId, userBId, s3CardUrl }
//
// In a single DB transaction:
//   1. Insert Match record (s3CardUrl stored in the blurb field)
//   2. Set optInStatus = 'opted_out' + lastMatchedAt = now for both users
// After transaction: send match email with card image (fire-and-forget).

import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import db from "@/lib/db";
import { MatchEmailService } from "@/services/MatchEmailService";
import { logger } from "@/utils/logger";

const log = logger.child("AdminMatchCreate");
const emailSvc = new MatchEmailService();

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

  const body = await req.json();
  const { userAId, userBId, s3CardUrl } = body as {
    userAId?: string;
    userBId?: string;
    s3CardUrl?: string;
  };

  if (!userAId || !userBId) {
    return NextResponse.json(
      { error: { message: "userAId and userBId are required" } },
      { status: 400 },
    );
  }
  if (!s3CardUrl?.trim()) {
    return NextResponse.json(
      { error: { message: "s3CardUrl is required" } },
      { status: 400 },
    );
  }

  let matchId: string;
  let matchedAt: Date;

  try {
    const now = new Date();
    const [match] = await db.$transaction([
      db.match.create({
        data: {
          userId1: userAId,
          userId2: userBId,
          matchedBy: adminId,
          blurb: s3CardUrl.trim(), // store s3 URL in blurb field
        },
      }),
      db.user.update({
        where: { id: userAId },
        data: { optInStatus: "opted_out", lastMatchedAt: now },
      }),
      db.user.update({
        where: { id: userBId },
        data: { optInStatus: "opted_out", lastMatchedAt: now },
      }),
    ]);
    matchId = match.id;
    matchedAt = match.matchedAt;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: { message: "Pair already matched" } },
        { status: 409 },
      );
    }
    throw err;
  }

  // Fire-and-forget match emails with card image
  sendMatchEmails(userAId, userBId, s3CardUrl.trim()).catch((err) =>
    log.error("Post-match emails failed", { userAId, userBId, err }),
  );

  return NextResponse.json({ data: { matchId, matchedAt } });
}

async function sendMatchEmails(
  userAId: string,
  userBId: string,
  cardImageUrl: string,
): Promise<void> {
  const users = await db.user.findMany({
    where: { id: { in: [userAId, userBId] } },
    select: { id: true, email: true, profile: { select: { fullName: true } } },
  });

  await Promise.allSettled(
    users
      .filter((u) => u.email)
      .map((u) =>
        emailSvc.sendPostMatchEmail({
          id: u.id,
          email: u.email!,
          name: u.profile?.fullName ?? "there",
          cardImageUrl,
        }),
      ),
  );
}
