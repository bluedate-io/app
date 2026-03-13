// ─── User Domain Entity ───────────────────────────────────────────────────────
// Pure domain object — no framework dependencies, no DB types.

import type { UserRole } from "@/types";

export type UserStatus = "active" | "inactive" | "banned" | "pending_verification";
export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export interface UserLocation {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface UserPreferences {
  minAge: number;
  maxAge: number;
  genderPreference: Gender[];
  maxDistanceKm: number;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  gender?: Gender;
  dateOfBirth?: Date;
  bio?: string;
  avatarUrl?: string;
  location?: UserLocation;
  preferences?: UserPreferences;
  isEmailVerified: boolean;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    return age - 1;
  }
  return age;
}

export function isUserActive(user: User): boolean {
  return user.status === "active" && user.isEmailVerified;
}

export function isProfileComplete(user: User): boolean {
  return !!(
    user.name &&
    user.bio &&
    user.dateOfBirth &&
    user.gender &&
    user.location
  );
}
