import { NextResponse } from "next/server";
import { getFridayCutoffIST, getWeekStartIST, isAfterFridayCutoff } from "@/utils/istTime";
import { verifyOptInToken } from "@/utils/optInToken";
import { MatchEmailService } from "@/services/MatchEmailService";
import { UserSelfRepository } from "@/repositories/UserSelfRepository";
import { BadRequestError, UnauthorizedError } from "@/utils/errors";
import { logger } from "@/utils/logger";

const log = logger.child("UserSelfService");

export class UserSelfService {
  constructor(
    private readonly repo: UserSelfRepository,
    private readonly matchEmailService: MatchEmailService,
  ) {}

  async getProfile(userId: string) {
    const [profile, preferences, interests, personality, photos] = await this.repo.getProfileBundle(userId);
    return {
      profile,
      preferences,
      interests,
      personality: personality
        ? {
            ...personality,
            smokingHabit: personality.smokingHabit ?? null,
            drinkingHabit: personality.drinkingHabit ?? null,
          }
        : null,
      photos,
    };
  }

  async getHomeOptIn(userId: string) {
    const now = new Date();
    const weekStart = getWeekStartIST(now);
    const deadline = getFridayCutoffIST(now);
    const record = await this.repo.findWeeklyOptIn(userId, weekStart);
    return {
      optedIn: !!record,
      mode: record?.mode ?? null,
      description: record?.description ?? null,
      weekStart: weekStart.toISOString(),
      deadline: deadline.toISOString(),
      windowOpen: now < deadline,
    };
  }

  async postHomeOptIn(userId: string, description?: string) {
    const now = new Date();
    const weekStart = getWeekStartIST(now);
    const deadline = getFridayCutoffIST(now);
    if (now >= deadline) {
      throw new BadRequestError("Opt-in window is closed for this week");
    }
    const prefs = await this.repo.findPreferenceIntent(userId);
    const mode = prefs?.relationshipIntent === "friendship" ? "bff" : "date";
    const record = await this.repo.upsertWeeklyOptIn(userId, weekStart, mode, description);
    return {
      optedIn: true,
      mode: record.mode,
      description: record.description,
      weekStart: weekStart.toISOString(),
      deadline: deadline.toISOString(),
      windowOpen: true,
    };
  }

  async toggleWantDate(userId: string, wantDate: boolean) {
    await this.repo.upsertWantDate(userId, wantDate);
    return { wantDate };
  }

  async updatePhone(userId: string, phone: string) {
    await this.repo.updatePhone(userId, phone);
    return { phone };
  }

  async confirmOptInFromToken(token: string, requestUrl: string) {
    const userId = verifyOptInToken(token);
    if (!userId) {
      log.warn("Invalid opt-in token received");
      return NextResponse.redirect(new URL("/optin/confirmed?status=invalid", requestUrl));
    }

    const user = await this.repo.findUserBasic(userId);
    if (!user) {
      log.warn("Opt-in token references unknown user", { userId });
      return NextResponse.redirect(new URL("/optin/confirmed?status=invalid", requestUrl));
    }

    const late = isAfterFridayCutoff();
    const optInStatus = late ? "opted_in_late" : "opted_in";
    await this.repo.updateOptInStatus(userId, optInStatus);
    log.info("User opted in", { userId, optInStatus });

    if (late && user.email) {
      this.matchEmailService
        .sendLateOptInConfirmation({
          email: user.email,
          name: user.profile?.fullName ?? "there",
        })
        .catch((err) => log.error("Late confirmation email failed", { userId, err }));
    }

    const status = late ? "late" : "in";
    return NextResponse.redirect(new URL(`/optin/confirmed?status=${status}`, requestUrl));
  }

  async buildRefreshTokenResult(accessToken: string | undefined, next: string, reqUrl: string, issueToken: (args: {
    userId: string;
    phone?: string;
    email?: string;
    role: string;
    onboardingCompleted: boolean;
  }) => { accessToken: string; expiresIn: number }, verifyToken: (token: string) => { sub: string; phone?: string; email?: string; role: string }) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/login", reqUrl));
    }
    const safeDest = next.startsWith("/") ? next : "/home";
    let payload: { sub: string; phone?: string; email?: string; role: string };
    try {
      payload = verifyToken(accessToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }
    const user = await this.repo.findUserBasic(payload.sub);
    if (!user) return NextResponse.redirect(new URL("/login", reqUrl));

    const token = issueToken({
      userId: payload.sub,
      phone: payload.phone,
      email: payload.email,
      role: payload.role,
      onboardingCompleted: user.onboardingCompleted,
    });

    const dest = user.onboardingCompleted ? safeDest : "/onboarding";
    const res = NextResponse.redirect(new URL(dest, reqUrl));
    res.cookies.set("access_token", token.accessToken, {
      path: "/",
      maxAge: token.expiresIn,
      sameSite: "lax",
      httpOnly: false,
    });
    return res;
  }
}

