// ─── User Domain Entity ───────────────────────────────────────────────────────
// Phone-first auth model. Profile, preferences, etc. live in their own domains.

import type { UserRole } from "@/types";

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: UserRole;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OtpVerification {
  id: string;
  phone: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
  userId?: string;
  createdAt: Date;
}

// ─── Sub-domain models (mirrors Prisma relations) ────────────────────────────

export interface Profile {
  id: string;
  userId: string;
  fullName?: string;
  nickname?: string;
  dateOfBirth?: Date;
  age?: number;
  city?: string;
  bio?: string;
}

export interface Preferences {
  id: string;
  userId: string;
  genderIdentity?: string;
  genderPreference: string[];
  ageRangeMin?: number;
  ageRangeMax?: number;
  relationshipIntent?: string;
  relationshipGoals: string[];
  heightCompleted?: boolean;
   /** True once the user has explicitly chosen Date or BFF (step 3) */
  datingModeCompleted?: boolean;
  photosStepCompleted?: boolean;
}

export interface Interests {
  id: string;
  userId: string;
  hobbies: string[];
  favouriteActivities: string[];
  musicTaste: string[];
  foodTaste: string[];
  bffInterests?: string[];
}

export interface Personality {
  id: string;
  userId: string;
  socialLevel?: string;
  conversationStyle?: string;
  funFact?: string;
  kidsStatus?: string;
  kidsPreference?: string;
  religion?: string[];
  politics?: string[];
  lifeExperiences?: string[];
}

export interface Availability {
  id: string;
  userId: string;
  days: string[];
  times: string[];
}

export interface AiSignals {
  id: string;
  userId: string;
  selfDescription?: string;
  idealPartner?: string;
  idealDate?: string;
}

export interface Photo {
  id: string;
  userId: string;
  url: string;
  order: number;
  createdAt: Date;
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

export function isOnboardingComplete(user: User): boolean {
  return user.onboardingCompleted;
}
