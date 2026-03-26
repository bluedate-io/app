import type {
  Profile,
  Preferences,
  Interests,
  Personality,
  Availability,
  AiSignals,
  Photo,
} from "@/domains/User";

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface ProfileResponseDTO {
  id: string;
  fullName?: string;
  nickname?: string;
  age?: number;
  city?: string;
  bio?: string;
}

export interface GenderResponseDTO {
  id: string;
  genderIdentity: string;
  genderUpdateCount?: number;
}

export interface PreferencesResponseDTO {
  id: string;
  genderIdentity?: string;
  genderUpdateCount?: number;
  genderPreference: string[];
  ageRangeMin?: number;
  ageRangeMax?: number;
  relationshipIntent?: string;
  relationshipGoals: string[];
}

export interface InterestsResponseDTO {
  id: string;
  hobbies: string[];
  favouriteActivities: string[];
  musicTaste: string[];
  foodTaste: string[];
  bffInterests?: string[];
}

export interface PersonalityResponseDTO {
  id: string;
  smokingHabit?: string;
  drinkingHabit?: string;
  funFact?: string;
  kidsStatus?: string;
  kidsPreference?: string;
  religion?: string[];
  politics?: string[];
  lifeExperiences?: string[];
}

export interface AvailabilityResponseDTO {
  id: string;
  days: string[];
  times: string[];
}

export interface AiSignalsResponseDTO {
  id: string;
  selfDescription?: string;
  idealPartner?: string;
  idealDate?: string;
}

export interface PhotoResponseDTO {
  id: string;
  url: string;
  order: number;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export const toProfileDTO = (p: Profile): ProfileResponseDTO => ({
  id: p.id,
  fullName: p.fullName,
  nickname: p.nickname,
  age: p.age,
  city: p.city,
  bio: p.bio,
});

export const toGenderDTO = (p: Preferences): GenderResponseDTO => ({
  id: p.id,
  genderIdentity: p.genderIdentity ?? "",
  genderUpdateCount: p.genderUpdateCount,
});

export const toPreferencesDTO = (p: Preferences): PreferencesResponseDTO => ({
  id: p.id,
  genderIdentity: p.genderIdentity,
  genderUpdateCount: p.genderUpdateCount,
  genderPreference: p.genderPreference,
  ageRangeMin: p.ageRangeMin,
  ageRangeMax: p.ageRangeMax,
  relationshipIntent: p.relationshipIntent,
  relationshipGoals: p.relationshipGoals ?? [],
});

export const toInterestsDTO = (i: Interests): InterestsResponseDTO => ({
  id: i.id,
  hobbies: i.hobbies,
  favouriteActivities: i.favouriteActivities,
  musicTaste: i.musicTaste,
  foodTaste: i.foodTaste,
  bffInterests: i.bffInterests,
});

export const toPersonalityDTO = (p: Personality): PersonalityResponseDTO => ({
  id: p.id,
  smokingHabit: p.smokingHabit,
  drinkingHabit: p.drinkingHabit,
  funFact: p.funFact,
  kidsStatus: p.kidsStatus,
  kidsPreference: p.kidsPreference,
  religion: p.religion ?? [],
  politics: p.politics ?? [],
  lifeExperiences: p.lifeExperiences ?? [],
});

export const toAvailabilityDTO = (a: Availability): AvailabilityResponseDTO => ({
  id: a.id,
  days: a.days,
  times: a.times,
});

export const toAiSignalsDTO = (a: AiSignals): AiSignalsResponseDTO => ({
  id: a.id,
  selfDescription: a.selfDescription,
  idealPartner: a.idealPartner,
  idealDate: a.idealDate,
});

export const toPhotoDTO = (p: Photo): PhotoResponseDTO => ({
  id: p.id,
  url: p.url,
  order: p.order,
});
