// ─── Admin JWT (cookie: admin_token) — platform admin routes only ─────────────

import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { config } from "@/config";
import { UnauthorizedError } from "@/utils/errors";

export function requireAdminId(req: NextRequest): string {
  try {
    const cookie = req.cookies.get("admin_token")?.value;
    if (!cookie) throw new UnauthorizedError("Unauthorized");
    const payload = jwt.verify(cookie, config.auth.jwtSecret) as { role?: string; sub?: string };
    if (payload.role !== "admin" || !payload.sub) {
      throw new UnauthorizedError("Unauthorized");
    }
    return payload.sub;
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError("Unauthorized");
  }
}
