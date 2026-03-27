// POST /api/admin/match-users/match
// ─────────────────────────────────────────────────────────────────────────────
// Creates a match between two users.  In a single DB transaction:
//   1. Insert the Match record
//   2. Set opt_in_status = 'opted_out' and last_matched_at = now for both users
// After the transaction commits, a post-match email is sent to both users
// (fire-and-forget — we never want an email failure to affect the HTTP response).

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import db from "@/lib/db";
import { MatchEmailService } from "@/services/MatchEmailService";
import { logger } from "@/utils/logger";

const log = logger.child("MatchRoute");
const emailSvc = new MatchEmailService();

function getAdminId(req: NextRequest): string | null {
  try {
    const cookie = req.cookies.get("admin_token")?.value;
    if (!cookie) return null;
    const payload = jwt.verify(cookie, config.auth.jwtSecret) as {
      role?: string;
      sub?: string;
    };
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

  const { userId1, userId2, blurb, cardImageUrl } = await req.json() as {
    userId1?: string;
    userId2?: string;
    blurb?: string | null;
    cardImageUrl?: string | null;
  };
  if (!userId1 || !userId2) {
    return NextResponse.json(
      { error: { message: "userId1 and userId2 required" } },
      { status: 400 },
    );
  }

  // ── Transaction: create match + opt-out both users atomically ─────────────
  let matchId: string;
  let matchedAt: Date;

  try {
    const now = new Date();
    const [match] = await db.$transaction([
      db.match.create({
        data: {
          userId1,
          userId2,
          matchedBy: adminId,
          blurb: blurb ?? null,
          cardImageUrl: cardImageUrl?.trim() ? cardImageUrl.trim() : null,
        },
      }),
      db.user.update({
        where: { id: userId1 },
        data: { optInStatus: "opted_out", lastMatchedAt: now },
      }),
      db.user.update({
        where: { id: userId2 },
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

  // ── Post-match emails (fire-and-forget after transaction commits) ──────────
  sendPostMatchEmails(userId1, userId2).catch((err) =>
    log.error("Post-match email(s) failed", { userId1, userId2, err }),
  );

  return NextResponse.json({ data: { matchId, matchedAt } });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sendPostMatchEmails(userId1: string, userId2: string): Promise<void> {
  const users = await db.user.findMany({
    where: { id: { in: [userId1, userId2] } },
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
        }),
      ),
  );
}
