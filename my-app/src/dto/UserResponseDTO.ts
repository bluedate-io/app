// ─── UserResponseDTO ──────────────────────────────────────────────────────────
// What we return to the client — never expose passwordHash.

import type { User } from "@/domains/User";
import type { UserRole } from "@/types";

export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  gender?: string;
  bio?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export function toUserResponseDTO(user: User): UserResponseDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    gender: user.gender,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}
