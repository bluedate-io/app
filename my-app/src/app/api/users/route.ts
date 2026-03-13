// ─── /api/users ───────────────────────────────────────────────────────────────
//  GET  /api/users        → list users (admin only)
//  POST /api/users        → create a new user (public — registration)

import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth, withHandler } from "@/middleware/withMiddleware";
import { requireRole } from "@/middleware/auth.middleware";

// POST /api/users — public registration endpoint
export const POST = withHandler((req: NextRequest) =>
  container.userController.createUser(req),
);

// GET /api/users — admin-only user listing
export const GET = withAuth(
  (req) => container.userController.listUsers(req),
  requireRole("admin"),
);
