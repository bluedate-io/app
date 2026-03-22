// ─── /onboarding — Server Component shell ────────────────────────────────────
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { db } from "@/lib/db";
import { OnboardingRepository } from "@/repositories/OnboardingRepository";
import OnboardingShell from "./OnboardingShell";

export interface OnboardingStatus {
  hasPhone: boolean;
  hasProfile: boolean;
  hasPreferences: boolean;
  /** True after user has chosen Date/BFF and saved (relationshipIntent set) */
  hasPreferencesComplete: boolean;
  /** True once the user has explicitly chosen Date or BFF (step 3) */
  hasDatingMode: boolean;
  hasInterests: boolean;
  hasPersonality: boolean;
  hasAvailability: boolean;
  photoCount: number;
  /** True only after user clicks Done on photos step (POST /api/onboarding/complete) */
  completed: boolean;
  /** Saved profile full name */
  fullName?: string;
  /** Saved gender identity */
  genderIdentity?: string;
  /** Set when preferences saved */
  relationshipIntent?: string;
  /** All selected relationship goals */
  relationshipGoals?: string[];
  /** Age range for matching */
  ageRangeMin?: number;
  ageRangeMax?: number;
  /** Saved height in cm */
  heightCm?: number;
  /** True when user has saved "who to meet" */
  hasGenderPreference?: boolean;
  /** True when height step has been completed */
  hasHeight: boolean;
  /** True when kids / family plans have been saved at least once */
  hasFamilyPlans: boolean;
  /** True when religion/politics step has been submitted */
  hasImportantLife: boolean;
  /** True when BFF "Your life" experiences have been saved */
  hasLifeExperiences: boolean;
  /** True when BFF-only interests step has been saved */
  hasBffInterests: boolean;
  /** True when user has explicitly advanced past the photos step */
  hasPhotosStepCompleted: boolean;
  /** True when BFF-only relationship status step has been saved */
  hasRelationshipStatus: boolean;
}

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/login");

  const secret = new TextEncoder().encode(config.auth.jwtSecret);
  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = payload.sub as string;
  } catch {
    redirect("/login");
  }

  // Check completion directly from DB — never trust the stale JWT for this
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true },
  });
  if (!user) redirect("/login");
  if (user.onboardingCompleted) redirect("/home");

  // Query full onboarding status from DB
  const repo = new OnboardingRepository(db);
  const raw = await repo.getOnboardingStatus(userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = raw as any;
  const status: OnboardingStatus = {
    ...raw,
    completed: false,
    hasDatingMode: r.hasDatingMode ?? false,
    hasRelationshipStatus: r.hasRelationshipStatus ?? false,
  };

  const currentStep = !status.hasProfile
    ? "profile"
    : !status.hasPreferences
      ? "preferences"
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
