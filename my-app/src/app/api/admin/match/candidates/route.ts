// ─── GET /api/admin/match/candidates ─────────────────────────────────────────
// Returns all User B candidates for a given User A, sorted same-city first.
// Excludes pairs already matched.
//
// Query params:
//   userId   — required, User A's id
//   city     — comma-separated city names (filter)
//   college  — comma-separated college names (filter)
//   gender   — optional override (comma-separated); default opposite of User A
//   ageMin   — minimum age (inclusive)
//   ageMax   — maximum age (inclusive)

import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { parseAdminMatchCandidatesQuery } from "@/validations/adminMatch.validation";

export async function GET(req: NextRequest) {
  try {
    requireAdminId(req);
    const q = parseAdminMatchCandidatesQuery(req.nextUrl.searchParams);
    const data = await container.adminMatchmakingService.getCandidates(q);
    return NextResponse.json({ data });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
