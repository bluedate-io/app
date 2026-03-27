// ─── Admin matchmaking API response shapes + mapping from repository rows ─────

import { extractEmailDomain } from "@/validations/match.validation";
import type { AdminMatchUserRow } from "@/repositories/AdminMatchmakingRepository";

export type AdminWeeklyOptInSnippet = {
  weekStart: Date;
  mode: string;
  description: string | null;
  createdAt: Date;
};

export type AdminPoolUserDTO = {
  id: string;
  name: string;
  age: number | null;
  city: string | null;
  college: string | null;
  gender: string | null;
  selfDescription: string | null;
  idealPartner: string | null;
  nickname: string | null;
  dateOfBirth: Date | null;
  bio: string | null;
  onboardingCompleted: boolean;
  optInStatus: string;
  optedInAt: Date | null;
  genderPreference: string[];
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  relationshipIntent: string | null;
  relationshipGoals: string[];
  heightCm: number | null;
  heightCompleted: boolean;
  wantDate: boolean | null;
  datingModeCompleted: boolean;
  photosStepCompleted: boolean;
  hobbies: string[];
  favouriteActivities: string[];
  musicTaste: string[];
  foodTaste: string[];
  bffInterests: string[];
  bffInterestsCompleted: boolean;
  smokingHabit: string | null;
  drinkingHabit: string | null;
  funFact: string | null;
  kidsStatus: string | null;
  kidsPreference: string | null;
  religion: string[];
  politics: string[];
  importantLifeCompleted: boolean;
  familyPlansCompleted: boolean;
  lifeExperiences: string[];
  lifeExperiencesCompleted: boolean;
  relationshipStatus: string | null;
  relationshipStatusCompleted: boolean;
  availabilityDays: string[];
  availabilityTimes: string[];
  idealDate: string | null;
  weeklyOptIns: AdminWeeklyOptInSnippet[];
  photos: string[];
  candidateCount?: number;
};

function derivedCollege(
  email: string | null | undefined,
  collegeByDomain: Map<string, string>,
): string | null {
  const domain = extractEmailDomain(email ?? null);
  if (!domain) return null;
  return collegeByDomain.get(domain) ?? null;
}

export function toAdminPoolUserDTO(
  u: AdminMatchUserRow,
  collegeByDomain: Map<string, string>,
  candidateCount?: number,
): AdminPoolUserDTO {
  const row: AdminPoolUserDTO = {
    id: u.id,
    name: u.profile?.fullName ?? "—",
    age: u.profile?.age ?? null,
    city: u.profile?.city ?? null,
    college: derivedCollege(u.email, collegeByDomain),
    gender: u.preferences?.genderIdentity ?? null,
    selfDescription: u.aiSignals?.selfDescription ?? u.profile?.bio ?? null,
    idealPartner: u.aiSignals?.idealPartner ?? null,
    nickname: u.profile?.nickname ?? null,
    dateOfBirth: u.profile?.dateOfBirth ?? null,
    bio: u.profile?.bio ?? null,
    onboardingCompleted: u.onboardingCompleted,
    optInStatus: u.optInStatus,
    optedInAt: u.optedInAt ?? null,
    genderPreference: u.preferences?.genderPreference ?? [],
    ageRangeMin: u.preferences?.ageRangeMin ?? null,
    ageRangeMax: u.preferences?.ageRangeMax ?? null,
    relationshipIntent: u.preferences?.relationshipIntent ?? null,
    relationshipGoals: u.preferences?.relationshipGoals ?? [],
    heightCm: u.preferences?.heightCm ?? null,
    heightCompleted: u.preferences?.heightCompleted ?? false,
    wantDate: u.preferences?.wantDate ?? null,
    datingModeCompleted: u.preferences?.datingModeCompleted ?? false,
    photosStepCompleted: u.preferences?.photosStepCompleted ?? false,
    hobbies: u.interests?.hobbies ?? [],
    favouriteActivities: u.interests?.favouriteActivities ?? [],
    musicTaste: u.interests?.musicTaste ?? [],
    foodTaste: u.interests?.foodTaste ?? [],
    bffInterests: u.interests?.bffInterests ?? [],
    bffInterestsCompleted: u.interests?.bffInterestsCompleted ?? false,
    smokingHabit: u.personality?.smokingHabit ?? null,
    drinkingHabit: u.personality?.drinkingHabit ?? null,
    funFact: u.personality?.funFact ?? null,
    kidsStatus: u.personality?.kidsStatus ?? null,
    kidsPreference: u.personality?.kidsPreference ?? null,
    religion: u.personality?.religion ?? [],
    politics: u.personality?.politics ?? [],
    importantLifeCompleted: u.personality?.importantLifeCompleted ?? false,
    familyPlansCompleted: u.personality?.familyPlansCompleted ?? false,
    lifeExperiences: u.personality?.lifeExperiences ?? [],
    lifeExperiencesCompleted: u.personality?.lifeExperiencesCompleted ?? false,
    relationshipStatus: u.personality?.relationshipStatus ?? null,
    relationshipStatusCompleted: u.personality?.relationshipStatusCompleted ?? false,
    availabilityDays: u.availability?.days ?? [],
    availabilityTimes: u.availability?.times ?? [],
    idealDate: u.aiSignals?.idealDate ?? null,
    weeklyOptIns: u.weeklyOptIns,
    photos: u.photos.map((p) => p.url),
  };
  if (candidateCount !== undefined) {
    row.candidateCount = candidateCount;
  }
  return row;
}

export type AdminMatchCreateResultDTO = {
  matchId: string;
  matchedAt: string;
};
