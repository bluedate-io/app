// ─── /onboarding — Server Component shell ────────────────────────────────────
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

  const { status } = result;
  const currentStep = !status.hasProfile
    ? "profile"
    : !status.hasPreferences
      ? "preferences"
      : !status.hasInterests
        ? "interests"
        : !status.hasPersonality || !status.hasAvailability
          ? "personality"
          : status.photoCount < 2
            ? "photos"
            : "complete";

  if (currentStep === "complete") redirect("/");

  return (
    <main className="min-h-screen bg-white">
      <OnboardingShell step={currentStep} token={token} status={status} />
    </main>
  );
}
