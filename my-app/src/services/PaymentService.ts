// ─── PaymentService ───────────────────────────────────────────────────────────

import type { PrismaClient } from "@/generated/prisma/client";
import { SubscriptionStatus } from "@/generated/prisma/client";
import type { ISubscriptionRepository } from "@/repositories/SubscriptionRepository";
import type { RazorpayService } from "@/services/RazorpayService";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { AppError } from "@/types";
import { ErrorCode } from "@/constants/errors";

const log = logger.child("PaymentService");

export interface RazorpayWebhookEvent {
  event: string;
  payload: {
    subscription?: {
      entity: {
        id: string;
        status: string;
        current_start?: number;
        current_end?: number;
        charge_at?: number;
      };
    };
    payment?: {
      entity: { id: string };
    };
  };
}

export class PaymentService {
  constructor(
    private readonly db: PrismaClient,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly razorpayService: RazorpayService,
  ) {}

  async initiateSubscription(userId: string): Promise<{ subscriptionId: string; keyId: string }> {
    const subscription = await this.razorpayService.createSubscription(userId);

    await this.subscriptionRepository.upsert(userId, {
      razorpaySubscriptionId: subscription.id,
      status: SubscriptionStatus.pending,
      startedAt: null,
      nextBillingAt: null,
      cancelledAt: null,
    });

    log.info("Razorpay subscription created", { userId, subscriptionId: subscription.id });
    return { subscriptionId: subscription.id, keyId: config.razorpay.keyId };
  }

  async verifyFirstPayment(
    subscriptionId: string,
    paymentId: string,
    signature: string
  ): Promise<void> {
    const valid = this.razorpayService.verifySubscriptionSignature(subscriptionId, paymentId, signature);
    if (!valid) {
      throw new AppError("Invalid payment signature", ErrorCode.BAD_REQUEST, 400);
    }

    const row = await this.subscriptionRepository.findByRazorpayId(subscriptionId);
    if (!row) {
      log.warn("Unknown subscription on verify", { subscriptionId });
      throw new AppError("Subscription not found", ErrorCode.NOT_FOUND, 400);
    }

    await this.db.$transaction([
      this.db.subscription.update({
        where: { razorpaySubscriptionId: subscriptionId },
        data: {
          status: SubscriptionStatus.active,
          startedAt: new Date(),
        },
      }),
      this.db.user.update({
        where: { id: row.userId },
        data: { planType: "vip" },
      }),
    ]);

    log.info("User upgraded to VIP via payment verify", { userId: row.userId, subscriptionId });
  }

  async handleWebhook(event: RazorpayWebhookEvent): Promise<void> {
    const { event: eventType, payload } = event;
    const subscriptionId = payload.subscription?.entity.id;

    if (!subscriptionId) {
      log.info("Webhook: no subscription in payload, ignoring", { eventType });
      return;
    }

    if (
      eventType === "subscription.activated" ||
      eventType === "subscription.authenticated"
    ) {
      const row = await this.subscriptionRepository.findByRazorpayId(subscriptionId);
      if (!row) {
        log.warn("Webhook: unknown subscription on activate", { subscriptionId });
        return;
      }

      const chargeAt = payload.subscription?.entity.charge_at;
      await this.db.$transaction([
        this.db.subscription.update({
          where: { razorpaySubscriptionId: subscriptionId },
          data: {
            status: SubscriptionStatus.active,
            startedAt: new Date(),
            nextBillingAt: chargeAt ? new Date(chargeAt * 1000) : null,
          },
        }),
        this.db.user.update({
          where: { id: row.userId },
          data: { planType: "vip" },
        }),
      ]);

      log.info("User upgraded to VIP via webhook", { userId: row.userId, eventType });
      return;
    }

    if (eventType === "subscription.charged") {
      const row = await this.subscriptionRepository.findByRazorpayId(subscriptionId);
      if (!row) {
        log.warn("Webhook: unknown subscription on charge", { subscriptionId });
        return;
      }

      const entity = payload.subscription?.entity;
      const nextBilling = entity?.current_end ?? entity?.charge_at;
      await this.db.subscription.update({
        where: { razorpaySubscriptionId: subscriptionId },
        data: {
          status: SubscriptionStatus.active,
          nextBillingAt: nextBilling ? new Date(nextBilling * 1000) : null,
        },
      });

      log.info("Subscription renewed", { userId: row.userId, eventType });
      return;
    }

    if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.halted" ||
      eventType === "subscription.completed" ||
      eventType === "subscription.expired"
    ) {
      const row = await this.subscriptionRepository.findByRazorpayId(subscriptionId);
      if (!row) {
        log.warn("Webhook: unknown subscription on deactivate", { subscriptionId });
        return;
      }

      const statusMap: Record<string, SubscriptionStatus> = {
        "subscription.cancelled": SubscriptionStatus.cancelled,
        "subscription.halted": SubscriptionStatus.suspended,
        "subscription.completed": SubscriptionStatus.expired,
        "subscription.expired": SubscriptionStatus.expired,
      };

      await this.db.$transaction([
        this.db.subscription.update({
          where: { razorpaySubscriptionId: subscriptionId },
          data: {
            status: statusMap[eventType] ?? SubscriptionStatus.cancelled,
            cancelledAt: new Date(),
          },
        }),
        this.db.user.update({
          where: { id: row.userId },
          data: { planType: "basic" },
        }),
      ]);

      log.info("User downgraded to Basic via webhook", { userId: row.userId, eventType });
      return;
    }

    log.info("Webhook: unhandled event, ignoring", { eventType });
  }
}
