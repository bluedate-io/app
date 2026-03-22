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
  /** Client redirect destination after successful OTP verification */
  redirectTo: "/onboarding" | "/home";
}

export interface UserAuthDTO {
  id: string;
  phone?: string;
  email?: string;
  collegeName?: string;
  role: string;
  onboardingCompleted: boolean;
}

export function toUserAuthDTO(user: User): UserAuthDTO {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    collegeName: user.collegeName,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted,
  };
}
