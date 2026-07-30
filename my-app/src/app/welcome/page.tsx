import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { db } from "@/lib/db";
import { WelcomeView } from "./WelcomeView";

export default async function WelcomePage() {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/login");

  let userId: string;
  try {
    const secret = new TextEncoder().encode(config.auth.jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    userId = payload.sub as string;
    if (!userId) throw new Error();
  } catch {
    redirect("/login");
  }

  const profile = await db.profile.findUnique({
    where: { userId },
    select: { fullName: true },
  });

  return <WelcomeView name={profile?.fullName ?? undefined} />;
}
