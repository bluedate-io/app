// ─── Next.js Edge Proxy (replaces middleware.ts in Next.js 16) ───────────────
// Runs on every matched request BEFORE it hits the route handler.

import { NextResponse, type NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
];

const PROTECTED = ["/home", "/matches", "/profile"];

/** Decode JWT payload without verifying signature (routing only — APIs still verify). */
function decodeJwt(token: string): { onboardingCompleted?: boolean } {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64)) as { onboardingCompleted?: boolean };
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

  const { onboardingCompleted } = decodeJwt(token);

  // Logged in + onboarding done → don't show login or onboarding again
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return NextResponse.next(); // let them continue onboarding
  }

  // Protected route + onboarding not done → back to onboarding
  if (isProtected && !onboardingCompleted) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

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
    "/home/:path*",
    "/matches/:path*",
    "/profile/:path*",
  ],
};
