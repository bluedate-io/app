import { NotFoundError } from "@/utils/errors";
import { AdminMatchesRepository } from "@/repositories/AdminMatchesRepository";

export class AdminMatchesService {
  constructor(private readonly repo: AdminMatchesRepository) {}

  async listMatches() {
    const matches = await this.repo.findActiveMatches();
    return matches.map((m) => ({
      id: m.id,
      matchedAt: m.matchedAt.toISOString(),
      blurb: m.blurb ?? null,
      cardImageUrl: m.cardImageUrl ?? null,
      woman: {
        id: m.user1.id,
        name: m.user1.profile?.fullName ?? "—",
        age: m.user1.profile?.age ?? null,
        city: m.user1.profile?.city ?? null,
        photoUrl: m.user1.photos[0]?.url ?? null,
      },
      man: {
        id: m.user2.id,
        name: m.user2.profile?.fullName ?? "—",
        age: m.user2.profile?.age ?? null,
        city: m.user2.profile?.city ?? null,
        photoUrl: m.user2.photos[0]?.url ?? null,
      },
    }));
  }

  async removeMatch(id: string) {
    const deleted = await this.repo.deleteMatch(id);
    if (!deleted) throw new NotFoundError("Match", id);
    return { deleted: true };
  }
}

