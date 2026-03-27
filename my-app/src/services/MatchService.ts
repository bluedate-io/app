import type { MatchListItem } from "@/types";
import type { ICollegeDomainRepository } from "@/repositories/CollegeDomainRepository";
import type { IMatchRepository, MatchPartnerRecord } from "@/repositories/MatchRepository";
import { extractEmailDomain, normalizeOptionalText } from "@/validations/match.validation";

export class MatchService {
  constructor(
    private readonly matchRepo: IMatchRepository,
    private readonly collegeDomainRepo: ICollegeDomainRepository,
  ) {}

  private async resolveCollegeName(partner: MatchPartnerRecord): Promise<string | null> {
    const domain = extractEmailDomain(partner.email);
    if (domain) {
      const domainMatch = await this.collegeDomainRepo.findByDomain(domain);
      if (domainMatch?.collegeName) return domainMatch.collegeName;
    }
    return normalizeOptionalText(partner.collegeName);
  }

  private resolveBio(partner: MatchPartnerRecord): string | null {
    return normalizeOptionalText(partner.profile?.bio ?? null);
  }

  async getUserMatches(userId: string): Promise<MatchListItem[]> {
    const matches = await this.matchRepo.findActiveMatchesForUser(userId);

    return Promise.all(matches.map(async (match) => {
      const partner = match.userId1 === userId ? match.user2 : match.user1;
      const college = await this.resolveCollegeName(partner);
      return {
        id: match.id,
        matchedAt: match.matchedAt.toISOString(),
        cardImageUrl: match.cardImageUrl ?? null,
        blurb: match.blurb ?? null,
        partner: {
          id: partner.id,
          name: partner.profile?.fullName?.trim() || "Your match",
          age: partner.profile?.age ?? null,
          gender: partner.preferences?.genderIdentity ?? null,
          college,
          bio: this.resolveBio(partner),
          weeklyOptInDescription: partner.weeklyOptIns[0]?.description ?? null,
          photos: partner.photos.map((p) => p.url),
        },
      };
    }));
  }
}
