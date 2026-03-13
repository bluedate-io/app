import type { User } from "@/domains/User";

export interface SendOtpResponseDTO {
  message: string;
  expiresInMinutes: number;
}

export interface AuthTokenDTO {
  accessToken: string;
  expiresIn: number; // seconds
}

export interface VerifyOtpResponseDTO {
  user: UserAuthDTO;
  token: AuthTokenDTO;
  onboardingCompleted: boolean;
  /** If false the client should redirect to /onboarding */
  redirectTo: "/onboarding" | "/";
}

export interface UserAuthDTO {
  id: string;
  phone: string;
  email?: string;
  role: string;
  onboardingCompleted: boolean;
}

export function toUserAuthDTO(user: User): UserAuthDTO {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted,
  };
}
