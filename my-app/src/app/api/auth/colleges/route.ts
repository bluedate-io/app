// GET /api/auth/colleges — returns all registered colleges for the login dropdown
import { type NextRequest } from "next/server";
import { container } from "@/lib/container";
import { withHandler } from "@/middleware/withMiddleware";

export const GET = withHandler((req: NextRequest) =>
  container.authController.colleges(req),
);
