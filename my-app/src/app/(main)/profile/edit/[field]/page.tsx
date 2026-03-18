// Profile edit page — Server Component
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { EditFieldView } from "./EditFieldView";
import type { ProfileData } from "../../page";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const VALID_FIELDS = [
  "photos",
  "interests",
  "looking-for",
  "height",
  "drinking",
  "religion",
  "family",
] as const;

export type EditField = (typeof VALID_FIELDS)[number];

async function getProfile(token: string): Promise<ProfileData | null> {
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

export default async function EditFieldPage({
  params,
}: {
  params: Promise<{ field: string }>;
}) {
  const { field } = await params;

  if (!VALID_FIELDS.includes(field as EditField)) redirect("/profile");

  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/login");

  const data = await getProfile(token);
  if (!data) redirect("/login");

  return <EditFieldView field={field as EditField} data={data} />;
}
