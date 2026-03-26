// GET /api/optin?token=<userToken>
// ─────────────────────────────────────────────────────────────────────────────
// No login required — the HMAC-signed token in the query string is the only
// authentication needed for this action.
//
// Behaviour:
//   • Verify token → resolve userId
//   • Before Friday 00:00 IST  → set optInStatus = 'opted_in'
//   • On/after Friday 00:00 IST → set optInStatus = 'opted_in_late'
//                                  + send late-confirmation email
//   • Redirect to /optin/confirmed?status=in | late | invalid

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyOptInToken } from "@/utils/optInToken";
import { isAfterFridayCutoff } from "@/utils/istTime";
import { MatchEmailService } from "@/services/MatchEmailService";
import { logger } from "@/utils/logger";

const log = logger.child("OptInRoute");
const emailSvc = new MatchEmailService();

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";

  // ── 1. Verify token ───────────────────────────────────────────────────────
  const userId = verifyOptInToken(token);
  if (!userId) {
    log.warn("Invalid opt-in token received");
    return NextResponse.redirect(new URL("/optin/confirmed?status=invalid", req.url));
  }

  // ── 2. Load user (need email + name for late-confirmation email) ──────────
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      profile: { select: { fullName: true } },
    },
  });

  if (!user) {
    log.warn("Opt-in token references unknown user", { userId });
    return NextResponse.redirect(new URL("/optin/confirmed?status=invalid", req.url));
  }

  // ── 3. Determine status ───────────────────────────────────────────────────
  const late = isAfterFridayCutoff();
  const optInStatus = late ? "opted_in_late" : "opted_in";

  await db.user.update({
    where: { id: userId },
    data: { optInStatus, optedInAt: new Date() },
  });

  log.info("User opted in", { userId, optInStatus });

  // ── 4. Late-confirmation email (fire-and-forget) ──────────────────────────
  if (late && user.email) {
    emailSvc
      .sendLateOptInConfirmation({
        email: user.email,
        name: user.profile?.fullName ?? "there",
      })
      .catch((err) => log.error("Late confirmation email failed", { userId, err }));
  }

  // ── 5. Redirect to confirmation page ─────────────────────────────────────
  const status = late ? "late" : "in";
  return NextResponse.redirect(new URL(`/optin/confirmed?status=${status}`, req.url));
}
