// ─── /onboarding — Server Component shell ────────────────────────────────────
// Reads the auth cookie server-side to determine which step to render.
// Each step is a Client Component form that POSTs to the matching API route.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import OnboardingShell from "./OnboardingShell";

async function getOnboardingStatus(token: string) {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  );
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub as string;

    // Fetch current step status from our API
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/onboarding/status`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
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
  hasInterests: boolean;
  hasPersonality: boolean;
  hasAvailability: boolean;
  photoCount: number;
}

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) redirect("/login");

  const result = await getOnboardingStatus(token);
  if (!result) redirect("/login");

  // Determine current incomplete step
  const { status } = result;
  const currentStep = !status.hasProfile
    ? "profile"
    : !status.hasPreferences
      ? "preferences"
      : !status.hasInterests
        ? "interests"
        : !status.hasPersonality
          ? "personality"
          : !status.hasAvailability
            ? "availability"
            : status.photoCount < 2
              ? "photos"
              : "complete";

  // All steps done — redirect to home
  if (currentStep === "complete") redirect("/");

  const steps = [
    "profile",
    "preferences",
    "interests",
    "personality",
    "availability",
    "photos",
  ] as const;
  const stepIndex = steps.indexOf(currentStep as (typeof steps)[number]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Step {stepIndex + 1} of {steps.length}</span>
            <span>{Math.round(((stepIndex + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <OnboardingShell step={currentStep} token={token} status={status} />
        </div>
      </div>
    </main>
  );
}