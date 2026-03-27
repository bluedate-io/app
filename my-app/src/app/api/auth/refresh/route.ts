import { NextRequest } from "next/server";
import { container } from "@/lib/container";

export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next") ?? "/home";
  const token = req.cookies.get("access_token")?.value;
  return container.userSelfService.buildRefreshTokenResult(
    token,
    next,
    req.url,
    ({ userId, phone, email, role, onboardingCompleted }) =>
      container.authService.issueToken(userId, phone, email, role, onboardingCompleted),
    (t) => container.authService.verifyAccessToken(t),
  );
}
