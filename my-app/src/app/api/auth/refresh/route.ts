// GET /api/auth/refresh?next=<path>
// Re-reads onboardingCompleted from DB, issues a fresh JWT, sets the cookie,
// and redirects to ?next (or /onboarding if onboarding is not yet complete).
// Called by the proxy to break the stale-JWT redirect loop.
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { config as appConfig } from "@/config";
import { db } from "@/lib/db";
import { container } from "@/lib/container";

export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next") ?? "/home";
  const safeDest = next.startsWith("/") ? next : "/home";

  const token = req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  let userId: string;
  let phone: string | undefined;
  let email: string | undefined;
  let role: string;

  try {
    const secret = new TextEncoder().encode(appConfig.auth.jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    userId = payload.sub as string;
    phone = payload.phone as string | undefined;
    email = payload.email as string | undefined;
    role = (payload.role as string) ?? "user";
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true },
  });
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const { accessToken, expiresIn } = container.authService.issueToken(
    userId, phone, email, role, user.onboardingCompleted,
  );

  const dest = user.onboardingCompleted ? safeDest : "/onboarding";
  const res = NextResponse.redirect(new URL(dest, req.url));
  res.cookies.set("access_token", accessToken, {
    path: "/",
    maxAge: expiresIn,
    sameSite: "lax",
    httpOnly: false,
  });
  return res;
}
