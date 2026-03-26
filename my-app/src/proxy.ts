// ─── Next.js Edge Proxy (replaces middleware.ts in Next.js 16) ───────────────
// Runs on every matched request BEFORE it hits the route handler.

import { NextResponse, type NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
];

const PROTECTED = ["/home", "/matches", "/profile"];

/** Decode JWT payload without verifying signature (routing only — APIs still verify). */
function decodeJwt(token: string): { onboardingCompleted?: boolean; exp?: number } {
  try {
    const b64 = token.split(".")[1];
    // Restore standard base64 and add padding
    const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
    const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
    return JSON.parse(atob(withPadding)) as { onboardingCompleted?: boolean; exp?: number };
  } catch {
    return {};
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("access_token")?.value;

  // ── Auth redirects ────────────────────────────────────────────────────────

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  // No token → send to login (protected routes only)
  if (!token) {
    if (isProtected || pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  const { onboardingCompleted, exp } = decodeJwt(token);
  const isExpired = exp !== undefined && exp < Math.floor(Date.now() / 1000);

  // Logged in with a valid (non-expired) token → skip login
  // If token is expired, let the user log in again (server components will verify)
  if (pathname === "/login" && !isExpired) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    if (onboardingCompleted && !isExpired) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return NextResponse.next(); // let them continue onboarding (or re-auth)
  }

  // Protected routes: pass through if token is present.
  // Server components verify JWT validity and handle onboarding checks themselves.
  // (Removing the proxy-level stale-onboardingCompleted redirect avoids RSC
  //  navigation issues where cookie updates from /api/auth/refresh aren't picked
  //  up by the next middleware pass.)

  // ── CORS (API routes) ─────────────────────────────────────────────────────

  const requestId = uuidv4();
  const origin = req.headers.get("origin") ?? "";
  const res = NextResponse.next();

  res.headers.set("x-request-id", requestId);

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/login",
    "/onboarding/:path*",
    "/onboarding",
    "/home",
    "/home/:path*",
    "/matches",
    "/matches/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
