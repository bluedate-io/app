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
