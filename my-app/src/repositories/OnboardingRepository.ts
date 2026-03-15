// ─── OnboardingRepository ─────────────────────────────────────────────────────
// Upsert-based writes for every onboarding step.
// Prisma returns null for optional fields; mappers convert to undefined.

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  Profile,
  Preferences,
  Interests,
  Personality,
  Availability,
  AiSignals,
  Photo,
} from "@/domains/User";
import type {
  ProfileInput,
  GenderIdentityInput,
  PreferencesInput,
  GenderPreferenceInput,
  RelationshipGoalsInput,
  InterestsInput,
  PersonalityInput,
  AvailabilityInput,
  AiSignalsInput,
} from "@/validations/onboarding.validation";

// null → undefined helpers
const n = <T>(v: T | null): T | undefined => v ?? undefined;

function computeAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) age--;
  return age;
}

const DEFAULT_GENDER_PREFERENCE = ["Men", "Women", "Nonbinary people"];

export interface IOnboardingRepository {
  upsertProfile(userId: string, data: ProfileInput): Promise<Profile>;
  upsertGenderIdentity(userId: string, data: GenderIdentityInput): Promise<Preferences>;
  upsertDatingMode(userId: string, mode: "date" | "bff"): Promise<Preferences>;
  upsertGenderPreference(userId: string, data: GenderPreferenceInput): Promise<Preferences>;
  upsertRelationshipGoals(userId: string, data: RelationshipGoalsInput): Promise<Preferences>;
  upsertPreferences(userId: string, data: PreferencesInput): Promise<Preferences>;
  upsertInterests(userId: string, data: InterestsInput): Promise<Interests>;
  upsertPersonality(userId: string, data: PersonalityInput): Promise<Personality>;
  upsertAvailability(userId: string, data: AvailabilityInput): Promise<Availability>;
  upsertAiSignals(userId: string, data: AiSignalsInput): Promise<AiSignals>;
  addPhoto(userId: string, url: string, order: number): Promise<Photo>;
  getPhotos(userId: string): Promise<Photo[]>;
  deletePhoto(photoId: string, userId: string): Promise<void>;
  getOnboardingStatus(userId: string): Promise<{
    hasProfile: boolean;
    hasPreferences: boolean;
    hasPreferencesComplete: boolean;
    hasUsedInviteCode: boolean;
    hasInterests: boolean;
    hasPersonality: boolean;
    hasAvailability: boolean;
    photoCount: number;
    fullName?: string;
    genderIdentity?: string;
    relationshipIntent?: string;
    relationshipGoals?: string[];
  }>;
  getGenderIdentity(userId: string): Promise<string | null>;
}

export class OnboardingRepository implements IOnboardingRepository {
  constructor(private readonly db: PrismaClient) {}

  async upsertProfile(userId: string, data: ProfileInput): Promise<Profile> {
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;
    const age = dateOfBirth ? computeAge(dateOfBirth) : undefined;
    const payload = {
      fullName: data.fullName,
      nickname: data.nickname ?? undefined,
      dateOfBirth,
      age,
      city: data.city ?? undefined,
      bio: data.bio ?? undefined,
    };
    const r = await this.db.profile.upsert({
      where: { userId },
      create: { userId, ...payload },
      update: payload,
    });
    return {
      id: r.id,
      userId: r.userId,
      fullName: n(r.fullName),
      nickname: n(r.nickname),
      dateOfBirth: r.dateOfBirth ?? undefined,
      age: n(r.age),
      city: n(r.city),
      bio: n(r.bio),
    };
  }

  async upsertGenderIdentity(userId: string, data: GenderIdentityInput): Promise<Preferences> {
    const r = await this.db.preferences.upsert({
      where: { userId },
      create: {
        userId,
        genderIdentity: data.genderIdentity,
        genderPreference: [],
        relationshipIntent: null,
        relationshipGoals: [],
      },
      update: { genderIdentity: data.genderIdentity },
    });
    return {
      id: r.id,
      userId: r.userId,
      genderIdentity: n(r.genderIdentity),
      genderPreference: r.genderPreference,
      ageRangeMin: n(r.ageRangeMin),
      ageRangeMax: n(r.ageRangeMax),
      relationshipIntent: n(r.relationshipIntent),
      relationshipGoals: r.relationshipGoals ?? [],
    };
  }

  async upsertDatingMode(userId: string, mode: "date" | "bff"): Promise<Preferences> {
    const relationshipIntent = mode === "bff" ? "friendship" : "date";
    const r = await this.db.preferences.upsert({
      where: { userId },
      create: {
        userId,
        relationshipIntent,
        genderPreference: DEFAULT_GENDER_PREFERENCE,
        ageRangeMin: 18,
        ageRangeMax: 55,
        relationshipGoals: [],
      },
      update: { relationshipIntent },
    });
    return {
      id: r.id,
      userId: r.userId,
      genderIdentity: n(r.genderIdentity),
      genderPreference: r.genderPreference,
      ageRangeMin: n(r.ageRangeMin),
      ageRangeMax: n(r.ageRangeMax),
      relationshipIntent: n(r.relationshipIntent),
      relationshipGoals: r.relationshipGoals ?? [],
    };
  }

  async upsertGenderPreference(userId: string, data: GenderPreferenceInput): Promise<Preferences> {
    const updateData: { genderPreference: string[]; ageRangeMin?: number; ageRangeMax?: number } = {
      genderPreference: data.genderPreference,
    };
    if (data.ageRangeMin != null) updateData.ageRangeMin = data.ageRangeMin;
    if (data.ageRangeMax != null) updateData.ageRangeMax = data.ageRangeMax;
    const r = await this.db.preferences.upsert({
      where: { userId },
      create: {
        userId,
        genderPreference: data.genderPreference,
        ageRangeMin: data.ageRangeMin ?? 18,
        ageRangeMax: data.ageRangeMax ?? 55,
        relationshipGoals: [],
      },
      update: updateData,
    });
    return {
      id: r.id,
      userId: r.userId,
      genderIdentity: n(r.genderIdentity),
      genderPreference: r.genderPreference,
      ageRangeMin: n(r.ageRangeMin),
      ageRangeMax: n(r.ageRangeMax),
      relationshipIntent: n(r.relationshipIntent),
      relationshipGoals: r.relationshipGoals ?? [],
    };
  }

  async upsertRelationshipGoals(userId: string, data: RelationshipGoalsInput): Promise<Preferences> {
    const r = await this.db.preferences.upsert({
      where: { userId },
      create: {
        userId,
        genderPreference: DEFAULT_GENDER_PREFERENCE,
        ageRangeMin: 18,
        ageRangeMax: 55,
        relationshipGoals: data.relationshipGoals,
      },
      update: { relationshipGoals: data.relationshipGoals },
    });
    return {
      id: r.id,
      userId: r.userId,
      genderIdentity: n(r.genderIdentity),
      genderPreference: r.genderPreference,
      ageRangeMin: n(r.ageRangeMin),
      ageRangeMax: n(r.ageRangeMax),
      relationshipIntent: n(r.relationshipIntent),
      relationshipGoals: r.relationshipGoals ?? [],
    };
  }

  async upsertPreferences(userId: string, data: PreferencesInput): Promise<Preferences> {
    const updatePayload: Record<string, unknown> = {
      genderIdentity: data.genderIdentity,
      genderPreference: data.genderPreference,
      ageRangeMin: data.ageRangeMin,
      ageRangeMax: data.ageRangeMax,
    };
    if (data.relationshipIntent !== undefined) {
      updatePayload.relationshipIntent = data.relationshipIntent;
    }
    if (data.relationshipGoals !== undefined) {
      updatePayload.relationshipGoals = data.relationshipGoals;
    }
    const r = await this.db.preferences.upsert({
      where: { userId },
      create: {
        userId,
        genderIdentity: data.genderIdentity,
        genderPreference: data.genderPreference,
        ageRangeMin: data.ageRangeMin,
        ageRangeMax: data.ageRangeMax,
        relationshipIntent: data.relationshipIntent ?? undefined,
        relationshipGoals: data.relationshipGoals ?? [],
      },
      update: updatePayload,
    });
    return {
      id: r.id, userId: r.userId,
      genderIdentity: n(r.genderIdentity),
      genderPreference: r.genderPreference,
      ageRangeMin: n(r.ageRangeMin), ageRangeMax: n(r.ageRangeMax),
      relationshipIntent: n(r.relationshipIntent),
      relationshipGoals: r.relationshipGoals ?? [],
    };
  }

  async upsertInterests(userId: string, data: InterestsInput): Promise<Interests> {
    const r = await this.db.interests.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });
    return {
      id: r.id, userId: r.userId,
      hobbies: r.hobbies,
      favouriteActivities: r.favouriteActivities,
      musicTaste: r.musicTaste,
      foodTaste: r.foodTaste,
    };
  }

  async upsertPersonality(userId: string, data: PersonalityInput): Promise<Personality> {
    const r = await this.db.personality.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });
    return {
      id: r.id, userId: r.userId,
      socialLevel: n(r.socialLevel),
      conversationStyle: n(r.conversationStyle),
      funFact: n(r.funFact),
    };
  }

  async upsertAvailability(userId: string, data: AvailabilityInput): Promise<Availability> {
    const r = await this.db.availability.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });
    return { id: r.id, userId: r.userId, days: r.days, times: r.times };
  }

  async upsertAiSignals(userId: string, data: AiSignalsInput): Promise<AiSignals> {
    const r = await this.db.aiSignals.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });
    return {
      id: r.id, userId: r.userId,
      selfDescription: n(r.selfDescription),
      idealPartner: n(r.idealPartner),
      idealDate: n(r.idealDate),
    };
  }

  async addPhoto(userId: string, url: string, order: number): Promise<Photo> {
    const r = await this.db.photo.create({ data: { userId, url, order } });
    return { id: r.id, userId: r.userId, url: r.url, order: r.order, createdAt: r.createdAt };
  }

  async getPhotos(userId: string): Promise<Photo[]> {
    const rows = await this.db.photo.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    });
    return rows.map((r) => ({
      id: r.id, userId: r.userId, url: r.url, order: r.order, createdAt: r.createdAt,
    }));
  }

  async deletePhoto(photoId: string, userId: string): Promise<void> {
    await this.db.photo.deleteMany({ where: { id: photoId, userId } });
  }

  async getOnboardingStatus(userId: string) {
    const [profile, preferences, inviteCodeUsed, interests, personality, availability, photoCount] =
      await this.db.$transaction([
        this.db.profile.findUnique({ where: { userId }, select: { id: true, fullName: true } }),
        this.db.preferences.findUnique({ where: { userId }, select: { id: true, relationshipIntent: true, genderIdentity: true, relationshipGoals: true } }),
        this.db.inviteCode.count({ where: { usedById: userId } }),
        this.db.interests.findUnique({ where: { userId }, select: { id: true } }),
        this.db.personality.findUnique({ where: { userId }, select: { id: true } }),
        this.db.availability.findUnique({ where: { userId }, select: { id: true } }),
        this.db.photo.count({ where: { userId } }),
      ]);
    const relationshipIntent = preferences?.relationshipIntent ?? undefined;
    const relationshipGoals = preferences?.relationshipGoals ?? [];
    const intentComplete = !!(relationshipIntent != null && relationshipIntent !== "" && relationshipIntent !== "undecided" && relationshipIntent !== "date");
    const goalsComplete = relationshipGoals.length >= 2;
    const hasPreferencesComplete = intentComplete || goalsComplete;
    return {
      hasProfile: !!profile,
      hasPreferences: !!preferences,
      hasPreferencesComplete,
      relationshipIntent: relationshipIntent ?? undefined,
      relationshipGoals: preferences?.relationshipGoals ?? undefined,
      hasUsedInviteCode: inviteCodeUsed > 0,
      hasInterests: !!interests,
      hasPersonality: !!personality,
      hasAvailability: !!availability,
      photoCount,
      fullName: profile?.fullName ?? undefined,
      genderIdentity: preferences?.genderIdentity ?? undefined,
    };
  }

  async getGenderIdentity(userId: string): Promise<string | null> {
    const prefs = await this.db.preferences.findUnique({
      where: { userId },
      select: { genderIdentity: true },
    });
    return prefs?.genderIdentity ?? null;
  }
}
