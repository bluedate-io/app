// GET /api/auth/me  — returns the currently authenticated user
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withAuth } from "@/middleware/withMiddleware";

export const GET = withAuth((req, ctx) =>
  container.authController.me(req, ctx),
);
