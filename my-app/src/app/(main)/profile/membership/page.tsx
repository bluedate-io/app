import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { db } from "@/lib/db";
import { MembershipView } from "./MembershipView";

export default async function MembershipPage() {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/login");

  const secret = new TextEncoder().encode(config.auth.jwtSecret);
  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = payload.sub as string;
  } catch {
    redirect("/login");
  }

  const [userRow, subscription] = await db.$transaction([
    db.user.findUnique({ where: { id: userId }, select: { planType: true } }),
    db.subscription.findUnique({
      where: { userId },
      select: { status: true, startedAt: true, nextBillingAt: true, createdAt: true },
    }),
  ]);

  return (
    <MembershipView
      planType={(userRow?.planType ?? "basic") as "basic" | "vip"}
      subscription={subscription ?? null}
    />
  );
}
