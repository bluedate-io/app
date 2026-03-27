// ─── GET /api/admin/match/pool ────────────────────────────────────────────────
// Returns opted-in, onboarding-complete users for the User A pool.
// For each pool user, includes a `candidateCount` (opposite-gender opted-in
// users not already matched with them, within the same filters).
//
// Query params:
//   gender   — filter User A pool by gender ("Man" | "Woman" | "Nonbinary")
//   city     — comma-separated city names
//   college  — comma-separated college names
//   ageMin   — minimum age (inclusive)
//   ageMax   — maximum age (inclusive)

import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";
import { parseAdminMatchPoolQuery } from "@/validations/adminMatch.validation";

export async function GET(req: NextRequest) {
  try {
    requireAdminId(req);
    const q = parseAdminMatchPoolQuery(req.nextUrl.searchParams);
    const data = await container.adminMatchmakingService.getPool(q);
    return NextResponse.json({ data });
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
