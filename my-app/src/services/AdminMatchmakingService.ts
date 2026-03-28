// ─── AdminMatchmakingService — pool, candidates, and curated match creation ───

import type { Prisma } from "@/generated/prisma/client";
import {
  toAdminPoolUserDTO,
  type AdminMatchCreateResultDTO,
  type AdminPoolUserDTO,
} from "@/dto/AdminMatchmakingDTO";
import {
  expandGenderFilterValues,
  normLower,
  oppositeGenderIdentityValues,
} from "@/domains/adminMatchmaking";
import type { IAdminMatchmakingRepository } from "@/repositories/AdminMatchmakingRepository";
import { MatchEmailService } from "@/services/MatchEmailService";
import { BadRequestError, ConflictError, NotFoundError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import type {
  AdminMatchCandidatesQuery,
  AdminMatchCreateBody,
  AdminMatchPoolQuery,
} from "@/validations/adminMatch.validation";
import { csvFromPoolQuery } from "@/validations/adminMatch.validation";

const log = logger.child("AdminMatchmakingService");

export class AdminMatchmakingService {
  constructor(
    private readonly repo: IAdminMatchmakingRepository,
    private readonly matchEmail: MatchEmailService,
  ) {}

  private async buildCollegeDomainMap(): Promise<Map<string, string>> {
    const collegeRows = await this.repo.findCollegeDomains();
    const collegeByDomain = new Map<string, string>();
    for (const cd of collegeRows) {
      const d = cd.domain?.trim().toLowerCase();
      if (!d) continue;
      collegeByDomain.set(d, cd.collegeName);
    }
    return collegeByDomain;
  }

  private buildBaseAndFilters(
    cities: string[],
    colleges: string[],
    domains: string[],
    ageMin: number | undefined,
    ageMax: number | undefined,
  ): Prisma.UserWhereInput[] {
    const baseAnd: Prisma.UserWhereInput[] = [
      { role: { not: "admin" } },
      { onboardingCompleted: true },
      { optInStatus: { in: ["opted_in", "opted_in_late"] } },
    ];

    if (cities.length > 0) baseAnd.push({ profile: { is: { city: { in: cities } } } });

    if (colleges.length > 0) {
      const domainOr: Prisma.UserWhereInput[] = domains
        .filter(Boolean)
        .map((d) => ({ email: { endsWith: `@${d}` } }));
      baseAnd.push(domainOr.length > 0 ? { OR: domainOr } : { id: { equals: "__no_match__" } });
    }
    if (ageMin !== undefined) baseAnd.push({ profile: { is: { age: { gte: ageMin } } } });
    if (ageMax !== undefined) baseAnd.push({ profile: { is: { age: { lte: ageMax } } } });

    return baseAnd;
  }

  private pushNameEmailSearch(and: Prisma.UserWhereInput[], search: string): void {
    const term = search.trim();
    if (!term) return;
    and.push({
      OR: [
        { email: { contains: term, mode: "insensitive" } },
        { profile: { is: { fullName: { contains: term, mode: "insensitive" } } } },
      ],
    });
  }

  private pushRelationshipIntentFilter(and: Prisma.UserWhereInput[], intent: string): void {
    const v = intent.trim();
    if (v !== "date" && v !== "friendship") return;
    and.push({ preferences: { is: { relationshipIntent: v } } });
  }

  async getPool(query: AdminMatchPoolQuery): Promise<AdminPoolUserDTO[]> {
    const { cities, colleges } = csvFromPoolQuery(query);
    const gender = query.gender?.trim() ?? "";
    const ageMin = query.ageMin;
    const ageMax = query.ageMax;

    const domains =
      colleges.length > 0 ? await this.repo.findDomainsByCollegeNames(colleges) : [];

    const baseAnd = this.buildBaseAndFilters(cities, colleges, domains, ageMin, ageMax);
    this.pushNameEmailSearch(baseAnd, query.search ?? "");
    this.pushRelationshipIntentFilter(baseAnd, query.relationshipIntent ?? "");
    const collegeByDomain = await this.buildCollegeDomainMap();

    const allUsers = await this.repo.findUsersForPool({ AND: baseAnd });
    const userIds = allUsers.map((u) => u.id);
    const existingMatches = await this.repo.findActiveMatchesAmongUserIds(userIds);

    const matchedWith = new Map<string, Set<string>>();
    for (const m of existingMatches) {
      if (!matchedWith.has(m.userId1)) matchedWith.set(m.userId1, new Set());
      if (!matchedWith.has(m.userId2)) matchedWith.set(m.userId2, new Set());
      matchedWith.get(m.userId1)!.add(m.userId2);
      matchedWith.get(m.userId2)!.add(m.userId1);
    }

    const gNorm = normLower(gender);
    const poolUsers = gender
      ? allUsers.filter((u) => normLower(u.preferences?.genderIdentity) === gNorm)
      : allUsers;
    const oppositeUsers = gender
      ? allUsers.filter((u) => normLower(u.preferences?.genderIdentity) !== gNorm)
      : allUsers;

    return poolUsers.map((u) => {
      const alreadyMatched = matchedWith.get(u.id) ?? new Set();
      const candidateCount = oppositeUsers.filter(
        (c) => c.id !== u.id && !alreadyMatched.has(c.id),
      ).length;
      return toAdminPoolUserDTO(u, collegeByDomain, candidateCount);
    });
  }

  async getCandidates(query: AdminMatchCandidatesQuery): Promise<AdminPoolUserDTO[]> {
    const userA = await this.repo.findUserAForCandidates(query.userId);
    if (!userA) {
      throw new NotFoundError("User", query.userId);
    }

    const userAGender = userA.preferences?.genderIdentity ?? null;
    const userACity = userA.profile?.city ?? null;

    if (!userAGender) {
      throw new BadRequestError("User A must have genderIdentity to find opposite-gender candidates");
    }

    const { cities, colleges, genderFilterRaw } = csvFromPoolQuery(query);
    const ageMin = query.ageMin;
    const ageMax = query.ageMax;

    const domains =
      colleges.length > 0 ? await this.repo.findDomainsByCollegeNames(colleges) : [];

    const and: Prisma.UserWhereInput[] = [
      { id: { not: query.userId } },
      { role: { not: "admin" } },
      { onboardingCompleted: true },
      { optInStatus: { in: ["opted_in", "opted_in_late"] } },
    ];

    if (genderFilterRaw.length > 0) {
      const allowed = expandGenderFilterValues(genderFilterRaw);
      if (allowed.length === 0) {
        throw new BadRequestError("Invalid gender filter");
      }
      and.push({ preferences: { is: { genderIdentity: { in: allowed } } } });
    } else {
      const oppositeGenderValues = oppositeGenderIdentityValues(userAGender);
      if (!oppositeGenderValues || oppositeGenderValues.length === 0) {
        throw new BadRequestError(
          `Unsupported genderIdentity for opposite-gender matching: ${userAGender}`,
        );
      }
      and.push({ preferences: { is: { genderIdentity: { in: oppositeGenderValues } } } });
    }

    if (cities.length > 0) and.push({ profile: { is: { city: { in: cities } } } });

    if (colleges.length > 0) {
      const domainOr: Prisma.UserWhereInput[] = domains
        .filter(Boolean)
        .map((d) => ({ email: { endsWith: `@${d}` } }));
      and.push(domainOr.length > 0 ? { OR: domainOr } : { id: { equals: "__no_match__" } });
    }
    if (ageMin !== undefined) and.push({ profile: { is: { age: { gte: ageMin } } } });
    if (ageMax !== undefined) and.push({ profile: { is: { age: { lte: ageMax } } } });

    this.pushNameEmailSearch(and, query.search ?? "");
    this.pushRelationshipIntentFilter(and, query.relationshipIntent ?? "");

    const collegeByDomain = await this.buildCollegeDomainMap();

    const candidates = await this.repo.findCandidateUsers({ AND: and });
    const candidateIds = candidates.map((c) => c.id);
    const existingMatches = await this.repo.findMatchesBetweenUserAndCandidates(
      query.userId,
      candidateIds,
    );

    const matchedIds = new Set<string>();
    for (const m of existingMatches) {
      if (m.userId1 === query.userId) matchedIds.add(m.userId2);
      else matchedIds.add(m.userId1);
    }

    const filtered = candidates.filter((c) => !matchedIds.has(c.id));

    filtered.sort((a, b) => {
      const aMatch = a.profile?.city === userACity && userACity != null;
      const bMatch = b.profile?.city === userACity && userACity != null;
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });

    return filtered.map((c) => toAdminPoolUserDTO(c, collegeByDomain));
  }

  async createMatch(adminId: string, body: AdminMatchCreateBody): Promise<AdminMatchCreateResultDTO> {
    const cardUrl = body.s3CardUrl.trim();

    try {
      const created = await this.repo.createMatchWithOptOuts({
        userAId: body.userAId,
        userBId: body.userBId,
        adminId,
        cardImageUrl: cardUrl,
      });

      this.sendPostMatchEmailsFireAndForget(body.userAId, body.userBId, cardUrl);

      return {
        matchId: created.id,
        matchedAt: created.matchedAt.toISOString(),
      };
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        throw new ConflictError("Pair already matched");
      }
      throw err;
    }
  }

  private sendPostMatchEmailsFireAndForget(
    userAId: string,
    userBId: string,
    cardImageUrl: string,
  ): void {
    this.repo
      .findUsersForPostMatchEmails([userAId, userBId])
      .then((users) => {
        const byId = new Map(users.map((u) => [u.id, u]));
        const userA = byId.get(userAId);
        const userB = byId.get(userBId);
        if (!userA || !userB) return Promise.resolve([]);

        return Promise.allSettled(
          [
            { recipient: userA, counterpart: userB },
            { recipient: userB, counterpart: userA },
          ]
            .filter((pair) => pair.recipient.email)
            .map(({ recipient, counterpart }) =>
              this.matchEmail.sendPostMatchEmail({
                id: recipient.id,
                email: recipient.email!,
                name: recipient.profile?.fullName ?? "there",
                cardImageUrl,
                otherPersonEmail: counterpart.email,
                otherPersonPhone: counterpart.phone,
              }),
            ),
        );
      })
      .catch((err) => log.error("Post-match emails failed", { userAId, userBId, err }));
  }
}
