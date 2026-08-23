// ─── Daily VIP expiry cron ─────────────────────────────────────────────────────
// Safety net for order-based VIP: downgrades users whose 30-day access window
// elapsed. The lazy check in PlanAccessService.getEffectivePlan already enforces
// this on every read; the cron just keeps the DB consistent.
//
// 03:00 IST = 21:30 UTC (previous day)

import { inngest } from "../client";
import { db } from "@/lib/db";
import { PlanAccessService } from "@/services/PlanAccessService";
import { logger } from "@/utils/logger";

const log = logger.child("VipExpiry");

export const expireVipAccess = inngest.createFunction(
  {
    id: "expire-vip-access",
    name: "Expire VIP access",
    retries: 2,
  },
  { cron: "30 21 * * *" }, // 03:00 IST daily
  async () => {
    const planAccess = new PlanAccessService(db);
    const downgraded = await planAccess.expireExpiredVipUsers();
    log.info("VIP expiry cron done", { downgraded });
    return { downgraded };
  },
);
