// ─── /onboarding — Server Component shell ────────────────────────────────────
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import OnboardingShell from "./OnboardingShell";

async function getOnboardingStatus(token: string) {
  const secret = new TextEncoder().encode(config.auth.jwtSecret);
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub as string;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/onboarding/status`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return { userId, status: json.data as OnboardingStatus };
  } catch {
    return null;
  }
}

export interface OnboardingStatus {
  hasProfile: boolean;
  hasPreferences: boolean;
  /** True after user has chosen Date/BFF and saved (relationshipIntent set) */
  hasPreferencesComplete: boolean;
  /** True once the user has explicitly chosen Date or BFF (step 3) */
  hasDatingMode: boolean;
  hasUsedInviteCode: boolean;
  hasInterests: boolean;
  hasPersonality: boolean;
  hasAvailability: boolean;
  photoCount: number;
  /** True only after user clicks Done on photos step (POST /api/onboarding/complete) */
  completed: boolean;
  /** Saved profile full name (from API), used for e.g. "{{name}} is a great name" */
  fullName?: string;
  /** Saved gender identity (for prefill when on Date/BFF step after refresh) */
  genderIdentity?: string;
  /** Set when preferences saved; "date" = chose Date mode, need who-to-meet; "undecided" = need relationship goal; else final intent */
  relationshipIntent?: string;
  /** All selected relationship goals (1–2) from step 5 */
  relationshipGoals?: string[];
  /** Age range for matching (step 5 — Date and BFF) */
  ageRangeMin?: number;
  ageRangeMax?: number;
  /** Saved height in cm (91–220) collected after goals/BFF */
  heightCm?: number;
  /** True when user has saved "who to meet" (gender preference) — Date flow only */
  hasGenderPreference?: boolean;
  /** True when height step (Next or Skip) has been completed */
  hasHeight: boolean;
  /** True when kids / family plans have been saved at least once */
  hasFamilyPlans: boolean;
  /** True when religion/politics step has been submitted (including skip) */
  hasImportantLife: boolean;
  /** True when BFF “Your life” experiences have been saved at least once */
  hasLifeExperiences: boolean;
  /** True when BFF-only interests step has been saved at least once */
  hasBffInterests: boolean;
  /** True when user has explicitly advanced past the photos step */
  hasPhotosStepCompleted: boolean;
}

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/login");

  const result = await getOnboardingStatus(token);
  if (!result) redirect("/login");

  const { status } = result;
  if (status.completed) redirect("/");

  const currentStep = !status.hasProfile
    ? "profile"
    : !status.hasPreferences
      ? "preferences"
      : !status.hasUsedInviteCode
        ? "inviteCode"
        : !status.hasDatingMode
          ? "preferences"
          : !status.hasInterests
          ? "interests"
          : !status.hasPersonality || !status.hasAvailability
            ? "personality"
            : "photos";

  return (
    <main className="min-h-screen bg-white">
      <OnboardingShell step={currentStep} token={token} status={status} />
    </main>
  );
}
