// ─── PaymentService ───────────────────────────────────────────────────────────

import crypto from "crypto";
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
    order?: {
      entity: {
        id: string;
        status?: string;
        amount?: number;
        notes?: Record<string, string>;
      };
    };
    payment?: {
      entity: {
        id: string;
        order_id?: string;
        status?: string;
        notes?: Record<string, string>;
      };
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
        // Subscription takes over — clear any order-based expiry.
        data: { planType: "vip", vipExpiresAt: null },
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
      eventType === "subscription.authenticated" ||
      eventType === "subscription.resumed"
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
          // Subscription takes over — clear any order-based expiry.
          data: { planType: "vip", vipExpiresAt: null },
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

    if (eventType === "subscription.pending") {
      const row = await this.subscriptionRepository.findByRazorpayId(subscriptionId);
      if (!row) {
        log.warn("Webhook: unknown subscription on pending", { subscriptionId });
        return;
      }

      await this.db.subscription.update({
        where: { razorpaySubscriptionId: subscriptionId },
        data: { status: SubscriptionStatus.pending },
      });

      log.info("Subscription moved to pending", { userId: row.userId, eventType });
      return;
    }

    if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.paused" ||
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
        "subscription.paused": SubscriptionStatus.suspended,
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

  // ─── Order flow — one-time payment (UPI-enabled), grants VIP for a fixed window ──

  async initiateOrder(
    userId: string,
  ): Promise<{ orderId: string; keyId: string; amount: number; currency: string }> {
    const amount = config.billing.vipAmountPaise;
    const receipt = crypto.randomUUID();

    const rzpOrder = await this.razorpayService.createOrder(amount, receipt, { userId });

    await this.db.paymentOrder.create({
      data: {
        userId,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
      },
    });

    log.info("Razorpay order created", { userId, orderId: rzpOrder.id, amount });
    return {
      orderId: rzpOrder.id,
      keyId: config.razorpay.keyId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
    };
  }

  async verifyOrderPayment(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
  ): Promise<{ activated: boolean; vipExpiresAt: Date | null }> {
    const valid = this.razorpayService.verifyOrderSignature(razorpayOrderId, razorpayPaymentId, signature);
    if (!valid) {
      throw new AppError("Invalid payment signature", ErrorCode.BAD_REQUEST, 400);
    }

    const order = await this.db.paymentOrder.findUnique({ where: { razorpayOrderId } });
    if (!order || order.userId !== userId) {
      log.warn("Unknown order on verify", { userId, razorpayOrderId });
      throw new AppError("Order not found", ErrorCode.NOT_FOUND, 400);
    }

    const accessEndsAt = await this.grantVipForOrder(razorpayOrderId, razorpayPaymentId);

    log.info("Order verified", { userId, razorpayOrderId, accessEndsAt });
    return { activated: true, vipExpiresAt: accessEndsAt };
  }

  /**
   * Marks the order paid and extends VIP. Idempotent and race-safe:
   * only the first caller transitions created → paid.
   * Returns the new access end date, or null if the order was already processed.
   */
  private async grantVipForOrder(
    razorpayOrderId: string,
    razorpayPaymentId: string | null,
  ): Promise<Date | null> {
    const now = new Date();
    const durationMs = config.billing.vipDurationDays * 24 * 60 * 60 * 1000;

    return this.db.$transaction(async (tx) => {
      const claimed = await tx.paymentOrder.updateMany({
        where: { razorpayOrderId, status: { not: "paid" } },
        data: { status: "paid", razorpayPaymentId: razorpayPaymentId ?? undefined, paidAt: now },
      });
      if (claimed.count === 0) {
        log.info("Order already processed, skipping", { razorpayOrderId });
        return null;
      }

      const order = await tx.paymentOrder.findUnique({ where: { razorpayOrderId } });
      if (!order) return null;

      // Still-active VIP extends from current expiry so no paid time is lost;
      // otherwise access starts now.
      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: { planType: true, vipExpiresAt: true },
      });
      const base =
        user?.planType === "vip" && user.vipExpiresAt && user.vipExpiresAt > now
          ? user.vipExpiresAt
          : now;
      const accessEndsAt = new Date(base.getTime() + durationMs);

      await tx.paymentOrder.update({
        where: { id: order.id },
        data: { accessEndsAt },
      });
      await tx.user.update({
        where: { id: order.userId },
        data: { planType: "vip", vipExpiresAt: accessEndsAt },
      });

      log.info("VIP granted via order", {
        userId: order.userId,
        razorpayOrderId,
        accessEndsAt,
      });
      return accessEndsAt;
    });
  }

  async handleOrderWebhook(event: RazorpayWebhookEvent): Promise<void> {
    const { event: eventType, payload } = event;

    if (eventType === "order.paid") {
      const orderId = payload.order?.entity.id;
      if (!orderId) {
        log.warn("Order webhook: missing order id", { eventType });
        return;
      }
      await this.grantVipForOrder(orderId, payload.payment?.entity.id ?? null);
      return;
    }

    if (eventType === "payment.captured") {
      const entity = payload.payment?.entity;
      if (!entity?.order_id) {
        log.info("Order webhook: captured payment without order_id, ignoring", { eventType });
        return;
      }
      await this.grantVipForOrder(entity.order_id, entity.id);
      return;
    }

    if (eventType === "payment.failed") {
      const orderId = payload.payment?.entity.order_id;
      if (!orderId) return;
      const result = await this.db.paymentOrder.updateMany({
        where: { razorpayOrderId: orderId, status: "created" },
        data: { status: "failed" },
      });
      if (result.count > 0) log.info("Order marked failed via webhook", { orderId });
      return;
    }

    log.info("Order webhook: unhandled event, ignoring", { eventType });
  }
}
