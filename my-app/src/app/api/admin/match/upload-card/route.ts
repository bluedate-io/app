// POST /api/admin/match/upload-card — multipart field `file` → public URL for match card image
// Supabase Storage: objects under `match-cards/` in SUPABASE_PHOTO_BUCKET; ensure bucket policies
// allow INSERT (and public read) for this prefix when using the anon/publishable key.
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import { adminRouteErrorResponse } from "@/utils/adminApiRoute";

export async function POST(req: NextRequest) {
  try {
    const adminId = requireAdminId(req);
    return await container.adminMatchmakingController.uploadMatchCard(req, adminId);
  } catch (e) {
    return adminRouteErrorResponse(e);
  }
}
