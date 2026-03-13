// ─── Next.js Edge Middleware ──────────────────────────────────────────────────
// Runs on every matched request BEFORE it hits the route handler.
// Ideal for: CORS headers, request-id injection, logging.
// Keep this file lean — heavy work belongs in route-level middleware.

import { NextResponse, type NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
];

export function proxy(req: NextRequest) {
  const requestId = uuidv4();
  const origin = req.headers.get("origin") ?? "";

  const res = NextResponse.next();

  // ── Request ID propagation ────────────────────────────────────────────────
  res.headers.set("x-request-id", requestId);

  // ── CORS ──────────────────────────────────────────────────────────────────
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS",
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  // Preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

export const config = {
  // Only run on /api/* routes
  matcher: ["/api/:path*"],
};
