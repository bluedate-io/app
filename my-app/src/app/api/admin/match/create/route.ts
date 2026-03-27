// ─── POST /api/admin/match/create ─────────────────────────────────────────────
// Creates a match between two users from the admin matchmaking page.
// Body: { userAId, userBId, s3CardUrl }
//
// In a single DB transaction:
//   1. Insert Match record (cardImageUrl = s3CardUrl)
//   2. Set optInStatus = 'opted_out' + lastMatchedAt = now for both users
// After transaction: send match email with card image (fire-and-forget).

import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { parseAdminMatchCreateBody } from "@/validations/adminMatch.validation";

export async function POST(req: NextRequest) {
  try {
    const adminId = requireAdminId(req);
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400 });
    }
    const body = parseAdminMatchCreateBody(raw);
    const data = await container.adminMatchmakingService.createMatch(adminId, body);
    return NextResponse.json({ data });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
