// ─── PlanAccessService ────────────────────────────────────────────────────────
// Central place for plan entitlement reads.
// Order-based VIP grants carry an expiry (users.vipExpiresAt); Razorpay-managed
// subscriptions have none (null) and are driven by webhooks.

import type { PrismaClient } from "@/generated/prisma/client";
import { logger } from "@/utils/logger";

const log = logger.child("PlanAccessService");

export interface EffectivePlan {
  planType: "basic" | "vip";
  /** Expiry of order-based VIP access. Null for subscription-managed or expired VIP. */
  vipExpiresAt: Date | null;
}

export class PlanAccessService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Returns the user's effective plan, lazily downgrading order-based VIP
   * whose window has elapsed so paywalls reappear immediately.
   */
  async getEffectivePlan(userId: string): Promise<EffectivePlan> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { planType: true, vipExpiresAt: true },
    });

    const planType = (user?.planType ?? "basic") as "basic" | "vip";
    if (!user) return { planType: "basic", vipExpiresAt: null };
    if (planType !== "vip") return { planType: "basic", vipExpiresAt: null };

    // Null expiry = subscription-managed VIP (webhook-driven).
    if (!user.vipExpiresAt) return { planType: "vip", vipExpiresAt: null };

    if (user.vipExpiresAt.getTime() <= Date.now()) {
      // A live Razorpay subscription overrides any stale order expiry.
      const sub = await this.db.subscription.findUnique({
        where: { userId },
        select: { status: true },
      });
      if (sub?.status === "active") return { planType: "vip", vipExpiresAt: null };

      await this.db.user.update({
        where: { id: userId },
        data: { planType: "basic" },
      });
      log.info("VIP expired, downgraded to basic", { userId, expiredAt: user.vipExpiresAt });
      return { planType: "basic", vipExpiresAt: null };
    }

    return { planType: "vip", vipExpiresAt: user.vipExpiresAt };
  }

  /** Bulk-downgrade all expired order-based VIP users. Used by the daily cron. */
  async expireExpiredVipUsers(): Promise<number> {
    const result = await this.db.user.updateMany({
      where: { planType: "vip", vipExpiresAt: { lte: new Date() } },
      data: { planType: "basic" },
    });
    if (result.count > 0) log.info(`Expired VIP downgraded`, { count: result.count });
    return result.count;
  }
}
