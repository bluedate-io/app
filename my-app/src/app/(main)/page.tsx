// Date page — Server Component
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { db } from "@/lib/db";
import { DateView } from "./DateView";

async function getWantDate(token: string): Promise<boolean> {
  const secret = new TextEncoder().encode(config.auth.jwtSecret);
  let payload: { sub?: string };
  try {
    const result = await jwtVerify(token, secret);
    payload = result.payload as { sub?: string };
  } catch {
    return true;
  }
  const userId = payload.sub;
  if (!userId) return true;

  const prefs = await db.preferences.findUnique({
    where: { userId },
    select: { wantDate: true },
  });
  return prefs?.wantDate ?? true;
}

export default async function DatePage() {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/login");

  const wantDate = await getWantDate(token);
  return <DateView initialWantDate={wantDate} />;
}
