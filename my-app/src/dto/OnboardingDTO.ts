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

export interface PreferencesResponseDTO {
  id: string;
  genderIdentity?: string;
  genderPreference: string[];
  ageRangeMin?: number;
  ageRangeMax?: number;
  relationshipIntent?: string;
}

export interface InterestsResponseDTO {
  id: string;
  hobbies: string[];
  favouriteActivities: string[];
  musicTaste: string[];
  foodTaste: string[];
}

export interface PersonalityResponseDTO {
  id: string;
  socialLevel?: string;
  conversationStyle?: string;
  funFact?: string;
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

export const toPreferencesDTO = (p: Preferences): PreferencesResponseDTO => ({
  id: p.id,
  genderIdentity: p.genderIdentity,
  genderPreference: p.genderPreference,
  ageRangeMin: p.ageRangeMin,
  ageRangeMax: p.ageRangeMax,
  relationshipIntent: p.relationshipIntent,
});

export const toInterestsDTO = (i: Interests): InterestsResponseDTO => ({
  id: i.id,
  hobbies: i.hobbies,
  favouriteActivities: i.favouriteActivities,
  musicTaste: i.musicTaste,
  foodTaste: i.foodTaste,
});

export const toPersonalityDTO = (p: Personality): PersonalityResponseDTO => ({
  id: p.id,
  socialLevel: p.socialLevel,
  conversationStyle: p.conversationStyle,
  funFact: p.funFact,
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
