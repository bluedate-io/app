// ─── GET /api/admin/match/pool ────────────────────────────────────────────────

import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export async function GET(req: NextRequest) {
  try {
    requireAdminId(req);
    return await container.adminMatchmakingController.getPool(req);
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
