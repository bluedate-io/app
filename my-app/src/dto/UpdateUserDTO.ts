// ─── UpdateUserDTO ────────────────────────────────────────────────────────────

import type { Gender, UserLocation, UserPreferences } from "@/domains/User";

export interface UpdateUserDTO {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  gender?: Gender;
  dateOfBirth?: string;
  location?: UserLocation;
  preferences?: Partial<UserPreferences>;
}
