import { ConflictError, NotFoundError } from "@/utils/errors";
import { AdminMatchUsersRepository } from "@/repositories/AdminMatchUsersRepository";
import { MatchEmailService } from "@/services/MatchEmailService";
import { logger } from "@/utils/logger";
import type {
  AdminMatchUsersCreateBody,
  AdminMatchUsersPageQuery,
} from "@/validations/adminMatchUsers.validation";

const log = logger.child("AdminMatchUsersService");

function inRange(value: number | null, min: number | null, max: number | null): boolean {
  if (value == null || min == null || max == null) return false;
  return value >= min && value <= max;
}

function overlap(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => setB.has(x.toLowerCase()));
}

export class AdminMatchUsersService {
  constructor(
    private readonly repo: AdminMatchUsersRepository,
    private readonly matchEmailService: MatchEmailService,
  ) {}

  async getOptedInUsers(query: AdminMatchUsersPageQuery) {
    const skip = (query.page - 1) * query.limit;
    const weekStart = this.repo.getCurrentWeekStart();
    const activeMatches = await this.repo.findActiveMatches();
    const matchedIds = new Set<string>();
    for (const m of activeMatches) {
      matchedIds.add(m.userId1);
      matchedIds.add(m.userId2);
    }

    const allOptIns = await this.repo.findWeeklyOptInsForWeek(weekStart);
    const eligible = allOptIns.filter((o) => o.user.onboardingCompleted && !matchedIds.has(o.userId));
    const total = eligible.length;
    const pageItems = eligible.slice(skip, skip + query.limit);

    const users = pageItems.map((o) => ({
      userId: o.userId,
      name: o.user.profile?.fullName ?? "—",
      age: o.user.profile?.age ?? null,
      city: o.user.profile?.city ?? null,
      photoUrl: o.user.photos[0]?.url ?? null,
      collegeName: o.user.collegeName ?? null,
      genderIdentity: o.user.preferences?.genderIdentity ?? null,
      genderPreference: o.user.preferences?.genderPreference ?? [],
      mode: o.mode,
      description: o.description ?? null,
      optedInAt: o.createdAt.toISOString(),
    }));

    return { users, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
  }

  async getSuggestions(userId: string) {
    const weekStart = this.repo.getCurrentWeekStart();
    const selectedOptIn = await this.repo.findWeeklyOptInByUserForCurrentWeek(userId, weekStart);
    if (!selectedOptIn) throw new NotFoundError("User not opted in this week");

    const sel = selectedOptIn.user;
    const selGender = sel.preferences?.genderIdentity ?? null;
    const selWants = sel.preferences?.genderPreference ?? [];
    const selCollege = sel.collegeName ?? null;

    const shapeSelected = () => {
      const p = sel.preferences;
      return {
        userId,
        name: sel.profile?.fullName ?? "—",
        age: sel.profile?.age ?? null,
        city: sel.profile?.city ?? null,
        bio: sel.profile?.bio ?? null,
        photoUrl: sel.photos[0]?.url ?? null,
        collegeName: sel.collegeName ?? null,
        genderIdentity: p?.genderIdentity ?? null,
        genderPreference: p?.genderPreference ?? [],
        mode: selectedOptIn.mode,
        description: selectedOptIn.description ?? null,
        lookingFor: p?.relationshipIntent ?? null,
        heightCm: p?.heightCm ?? null,
        ageRange: p?.ageRangeMin && p?.ageRangeMax ? `${p.ageRangeMin}–${p.ageRangeMax}` : null,
        interestedIn: p?.genderPreference ?? [],
        religion: sel.personality?.religion ?? [],
        kidsStatus: sel.personality?.kidsStatus ?? null,
        kidsPreference: sel.personality?.kidsPreference ?? null,
        smokingHabit: sel.personality?.smokingHabit ?? null,
        drinkingHabit: sel.personality?.drinkingHabit ?? null,
        hobbies: sel.interests?.hobbies ?? [],
        activities: sel.interests?.favouriteActivities ?? [],
      };
    };

    if (!selCollege) return { candidates: [], selectedUser: shapeSelected() };

    const activeMatches = await this.repo.findActiveMatches();
    const matchedIds = new Set<string>();
    for (const m of activeMatches) {
      matchedIds.add(m.userId1);
      matchedIds.add(m.userId2);
    }

    const skips = await this.repo.findAdminSkipsForUser(userId);
    const skippedIds = new Set<string>();
    for (const s of skips) {
      skippedIds.add(s.userId1 === userId ? s.userId2 : s.userId1);
    }

    const candidateOptIns = await this.repo.findCandidateWeeklyOptInsSameCollege(
      weekStart,
      userId,
      selCollege,
    );

    const scored: Array<Record<string, unknown>> = [];

    for (const optIn of candidateOptIns) {
      const c = optIn.user;
      const cId = optIn.userId;
      const cGender = c.preferences?.genderIdentity ?? null;
      const cWants = c.preferences?.genderPreference ?? [];

      if (matchedIds.has(cId) || skippedIds.has(cId)) continue;

      const selWantsCandidate = selGender
        ? cWants.some((g) => g.toLowerCase() === selGender.toLowerCase())
        : false;
      const candidateWantsSel = cGender
        ? selWants.some((g) => g.toLowerCase() === cGender.toLowerCase())
        : false;
      if (!selWantsCandidate || !candidateWantsSel) continue;

      const breakdown: Array<{ label: string; pts: number }> = [];
      if (optIn.mode === selectedOptIn.mode) breakdown.push({ label: "Same intent (date/bff)", pts: 20 });

      const selAge = sel.profile?.age ?? null;
      const cAge = c.profile?.age ?? null;
      const selMin = sel.preferences?.ageRangeMin ?? null;
      const selMax = sel.preferences?.ageRangeMax ?? null;
      const cMin = c.preferences?.ageRangeMin ?? null;
      const cMax = c.preferences?.ageRangeMax ?? null;
      if (inRange(cAge, selMin, selMax)) breakdown.push({ label: "Their age fits your range", pts: 15 });
      if (inRange(selAge, cMin, cMax)) breakdown.push({ label: "Your age fits their range", pts: 15 });

      const selHobbies = sel.interests?.hobbies ?? [];
      const cHobbies = c.interests?.hobbies ?? [];
      const sharedHobbies = overlap(selHobbies, cHobbies);
      if (sharedHobbies.length > 0) {
        breakdown.push({
          label: `Shared hobbies: ${sharedHobbies.slice(0, 3).join(", ")}`,
          pts: Math.min(5 * sharedHobbies.length, 25),
        });
      }

      const selActs = sel.interests?.favouriteActivities ?? [];
      const cActs = c.interests?.favouriteActivities ?? [];
      const sharedActs = overlap(selActs, cActs);
      if (sharedActs.length > 0) {
        breakdown.push({
          label: `Shared activities: ${sharedActs.slice(0, 3).join(", ")}`,
          pts: Math.min(3 * sharedActs.length, 15),
        });
      }

      const selRel = sel.personality?.religion ?? [];
      const cRel = c.personality?.religion ?? [];
      if (overlap(selRel, cRel).length > 0) breakdown.push({ label: "Same religion", pts: 10 });

      if (
        sel.profile?.city &&
        c.profile?.city &&
        sel.profile.city.toLowerCase() === c.profile.city.toLowerCase()
      ) {
        breakdown.push({ label: "Same city", pts: 8 });
      }

      if (
        sel.personality?.smokingHabit &&
        c.personality?.smokingHabit &&
        sel.personality.smokingHabit === c.personality.smokingHabit
      ) {
        breakdown.push({ label: "Same smoking habit", pts: 5 });
      }
      if (
        sel.personality?.drinkingHabit &&
        c.personality?.drinkingHabit &&
        sel.personality.drinkingHabit === c.personality.drinkingHabit
      ) {
        breakdown.push({ label: "Same drinking habit", pts: 5 });
      }

      const score = breakdown.reduce((s, b) => s + b.pts, 0);
      scored.push({
        userId: cId,
        name: c.profile?.fullName ?? "—",
        age: c.profile?.age ?? null,
        city: c.profile?.city ?? null,
        bio: c.profile?.bio ?? null,
        photoUrl: c.photos[0]?.url ?? null,
        collegeName: c.collegeName ?? null,
        genderIdentity: cGender,
        genderPreference: cWants,
        mode: optIn.mode,
        description: optIn.description ?? null,
        lookingFor: c.preferences?.relationshipIntent ?? null,
        heightCm: c.preferences?.heightCm ?? null,
        ageRange: cMin && cMax ? `${cMin}–${cMax}` : null,
        interestedIn: cWants,
        religion: cRel,
        kidsStatus: c.personality?.kidsStatus ?? null,
        kidsPreference: c.personality?.kidsPreference ?? null,
        smokingHabit: c.personality?.smokingHabit ?? null,
        drinkingHabit: c.personality?.drinkingHabit ?? null,
        hobbies: cHobbies,
        activities: cActs,
        score,
        scoreBreakdown: breakdown,
      });
    }

    scored.sort((a, b) => Number(b.score) - Number(a.score));
    return { candidates: scored, selectedUser: shapeSelected() };
  }

  async createSkip(adminId: string, userId1: string, userId2: string) {
    await this.repo.upsertAdminSkip(userId1, userId2, adminId);
    return { skipped: true };
  }

  async getCandidates() {
    const activeMatches = await this.repo.findActiveMatches();
    const matchedIds = new Set<string>();
    for (const m of activeMatches) {
      matchedIds.add(m.userId1);
      matchedIds.add(m.userId2);
    }

    const [womenRaw, menRaw] = await Promise.all([
      this.repo.findUsersForCandidatesByGender("Woman"),
      this.repo.findUsersForCandidatesByGender("Man"),
    ]);

    const shape = (u: (typeof womenRaw)[number]) => ({
      userId: u.id,
      name: u.profile?.fullName ?? "—",
      age: u.profile?.age ?? null,
      city: u.profile?.city ?? null,
      photoUrl: u.photos[0]?.url ?? null,
      lookingFor: u.preferences?.relationshipIntent ?? null,
      heightCm: u.preferences?.heightCm ?? null,
      ageRange:
        u.preferences?.ageRangeMin && u.preferences?.ageRangeMax
          ? `${u.preferences.ageRangeMin}–${u.preferences.ageRangeMax}`
          : null,
      interestedIn: u.preferences?.genderPreference ?? [],
      religion: u.personality?.religion ?? [],
      kidsStatus: u.personality?.kidsStatus ?? null,
      kidsPreference: u.personality?.kidsPreference ?? null,
      smokingHabit: u.personality?.smokingHabit ?? null,
      drinkingHabit: u.personality?.drinkingHabit ?? null,
      hobbies: u.interests?.hobbies ?? [],
      activities: u.interests?.favouriteActivities ?? [],
      bio: u.profile?.bio ?? null,
    });

    return {
      women: womenRaw.filter((u) => !matchedIds.has(u.id)).map(shape),
      men: menRaw.filter((u) => !matchedIds.has(u.id)).map(shape),
    };
  }

  async createMatch(adminId: string, body: AdminMatchUsersCreateBody) {
    try {
      const created = await this.repo.createLegacyMatchWithOptOuts({
        userId1: body.userId1,
        userId2: body.userId2,
        adminId,
        blurb: body.blurb ?? null,
        cardImageUrl: body.cardImageUrl ?? null,
      });
      this.sendPostMatchEmails(body.userId1, body.userId2);
      return { matchId: created.id, matchedAt: created.matchedAt };
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
        throw new ConflictError("Pair already matched");
      }
      throw err;
    }
  }

  private sendPostMatchEmails(userId1: string, userId2: string): void {
    this.repo
      .findUsersForPostMatchEmails([userId1, userId2])
      .then(
        (users: Array<{
          id: string;
          email: string | null;
          phone: string | null;
          profile: { fullName: string | null } | null;
        }>) => {
          const byId = new Map(users.map((u) => [u.id, u]));
          const user1 = byId.get(userId1);
          const user2 = byId.get(userId2);
          if (!user1 || !user2) return Promise.resolve([]);

          return Promise.allSettled(
            [
              { recipient: user1, counterpart: user2 },
              { recipient: user2, counterpart: user1 },
            ]
              .filter((pair) => pair.recipient.email)
              .map(({ recipient, counterpart }) =>
                this.matchEmailService.sendPostMatchEmail({
                  id: recipient.id,
                  email: recipient.email!,
                  name: recipient.profile?.fullName ?? "there",
                  otherPersonEmail: counterpart.email,
                  otherPersonPhone: counterpart.phone,
                }),
              ),
          );
        },
      )
      .catch((err: unknown) => log.error("Post-match email(s) failed", { userId1, userId2, err }));
  }
}
