// ─── Profile page — Server Component ─────────────────────────────────────────
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { ProfileView } from "./ProfileView";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function getProfile(token: string) {
  const secret = new TextEncoder().encode(config.auth.jwtSecret);
  try {
    await jwtVerify(token, secret);
  } catch {
    return null;
  }
  const res = await fetch(`${BASE}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as ProfileData;
}

export interface ProfileData {
  profile: {
    fullName?: string;
    dateOfBirth?: string;
    city?: string;
    bio?: string;
  } | null;
  preferences: {
    genderIdentity?: string;
    genderPreference?: string[];
    ageRangeMin?: number;
    ageRangeMax?: number;
    heightCm?: number;
    relationshipIntent?: string;
    relationshipGoals?: string[];
  } | null;
  interests: {
    hobbies?: string[];
    favouriteActivities?: string[];
  } | null;
  personality: {
    socialLevel?: string;
    conversationStyle?: string;
    kidsStatus?: string;
    kidsPreference?: string;
    religion?: string[];
    politics?: string[];
  } | null;
  photos: { url: string; order: number }[];
}

export default async function ProfilePage() {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/login");

  const data = await getProfile(token);
  if (!data) redirect("/login");

  return <ProfileView data={data} />;
}
