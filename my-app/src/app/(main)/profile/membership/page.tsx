import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { container } from "@/lib/container";
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

  const [plan, subscription, lastOrder] = await Promise.all([
    container.planAccessService.getEffectivePlan(userId),
    db.subscription.findUnique({
      where: { userId },
      select: { status: true, startedAt: true, nextBillingAt: true, createdAt: true },
    }),
    db.paymentOrder.findFirst({
      where: { userId, status: "paid" },
      orderBy: { paidAt: "desc" },
      select: { paidAt: true, accessEndsAt: true, amount: true },
    }),
  ]);

  return (
    <MembershipView
      planType={plan.planType}
      vipExpiresAt={plan.vipExpiresAt}
      subscription={subscription ?? null}
      lastOrder={
        lastOrder?.paidAt
          ? {
              paidAt: lastOrder.paidAt,
              accessEndsAt: lastOrder.accessEndsAt,
              amountPaise: lastOrder.amount,
            }
          : null
      }
    />
  );
}
