// ─── POST /api/auth/register ──────────────────────────────────────────────────

import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withHandler } from "@/middleware/withMiddleware";

export const POST = withHandler((req: NextRequest) =>
  container.authController.register(req),
);
