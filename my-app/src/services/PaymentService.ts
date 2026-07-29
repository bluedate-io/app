// ─── PaymentService ───────────────────────────────────────────────────────────
// Orchestrates subscription lifecycle: initiate, activate, handle webhooks.

import type { PrismaClient } from "@/generated/prisma/client";
import type { ISubscriptionRepository } from "@/repositories/SubscriptionRepository";
import type { PayPalService } from "@/services/PayPalService";
import { config } from "@/config";
import { logger } from "@/utils/logger";

const log = logger.child("PaymentService");

export interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id: string;
    status?: string;
    start_time?: string;
    billing_info?: { next_billing_time?: string };
  };
}

const ACTIVATE_EVENTS = new Set([
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.RE-ACTIVATED",
]);

const DEACTIVATE_EVENTS = new Set([
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED",
]);

export class PaymentService {
  constructor(
    private readonly db: PrismaClient,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly payPalService: PayPalService,
  ) {}

  async initiateSubscription(userId: string): Promise<{ approvalUrl: string }> {
    const returnUrl = `${config.app.url}/api/payment/success`;
    const cancelUrl = `${config.app.url}/payment/cancel`;

    const { subscriptionId, approvalUrl } =
      await this.payPalService.createSubscription(userId, returnUrl, cancelUrl);

    await this.subscriptionRepository.upsert(userId, {
      paypalSubscriptionId: subscriptionId,
      status: "pending",
      startedAt: null,
      nextBillingAt: null,
      cancelledAt: null,
    });

    log.info("Subscription initiated", { userId, subscriptionId });
    return { approvalUrl };
  }

  async activateFromRedirect(paypalSubscriptionId: string): Promise<void> {
    const sub = await this.payPalService.getSubscription(paypalSubscriptionId);

    if (sub.status !== "ACTIVE") {
      log.info("Subscription not yet ACTIVE on redirect, skipping", {
        paypalSubscriptionId,
        status: sub.status,
      });
      return;
    }

    const row = await this.subscriptionRepository.findByPaypalId(paypalSubscriptionId);
    if (!row) {
      log.warn("Unknown subscription on success redirect", { paypalSubscriptionId });
      return;
    }

    await this.db.$transaction([
      this.db.subscription.update({
        where: { paypalSubscriptionId },
        data: {
          status: "active",
          startedAt: sub.start_time ? new Date(sub.start_time) : new Date(),
          nextBillingAt: sub.billing_info?.next_billing_time
            ? new Date(sub.billing_info.next_billing_time)
            : null,
        },
      }),
      this.db.user.update({
        where: { id: row.userId },
        data: { planType: "vip" },
      }),
    ]);

    log.info("User upgraded to VIP via redirect", { userId: row.userId, paypalSubscriptionId });
  }

  async handleWebhook(event: PayPalWebhookEvent): Promise<void> {
    const { event_type, resource } = event;
    const paypalSubscriptionId = resource.id;

    if (ACTIVATE_EVENTS.has(event_type)) {
      const row = await this.subscriptionRepository.findByPaypalId(paypalSubscriptionId);
      if (!row) {
        log.warn("Webhook: unknown subscription", { paypalSubscriptionId, event_type });
        return;
      }

      await this.db.$transaction([
        this.db.subscription.update({
          where: { paypalSubscriptionId },
          data: {
            status: "active",
            startedAt: resource.start_time ? new Date(resource.start_time) : new Date(),
            nextBillingAt: resource.billing_info?.next_billing_time
              ? new Date(resource.billing_info.next_billing_time)
              : null,
          },
        }),
        this.db.user.update({
          where: { id: row.userId },
          data: { planType: "vip" },
        }),
      ]);

      log.info("User upgraded to VIP via webhook", { userId: row.userId, event_type });
      return;
    }

    if (DEACTIVATE_EVENTS.has(event_type)) {
      const row = await this.subscriptionRepository.findByPaypalId(paypalSubscriptionId);
      if (!row) {
        log.warn("Webhook: unknown subscription on deactivate", { paypalSubscriptionId, event_type });
        return;
      }

      const statusMap: Record<string, string> = {
        "BILLING.SUBSCRIPTION.CANCELLED": "cancelled",
        "BILLING.SUBSCRIPTION.SUSPENDED": "suspended",
        "BILLING.SUBSCRIPTION.EXPIRED": "expired",
      };

      await this.db.$transaction([
        this.db.subscription.update({
          where: { paypalSubscriptionId },
          data: {
            status: statusMap[event_type] ?? "cancelled",
            cancelledAt: new Date(),
          },
        }),
        this.db.user.update({
          where: { id: row.userId },
          data: { planType: "basic" },
        }),
      ]);

      log.info("User downgraded to Basic via webhook", { userId: row.userId, event_type });
      return;
    }

    log.info("Webhook: unhandled event type, ignoring", { event_type });
  }
}
