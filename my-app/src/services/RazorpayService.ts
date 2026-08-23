// ─── RazorpayService ──────────────────────────────────────────────────────────

import crypto from "crypto";
import { config } from "@/config";
import { AppError } from "@/types";
import { ErrorCode } from "@/constants/errors";

export interface RazorpaySubscription {
  id: string;
  status: string; // "created" | "authenticated" | "active" | "pending" | "halted" | "cancelled" | "completed" | "expired"
  current_start?: number;
  current_end?: number;
  charge_at?: number;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string; // "created" | "paid" | ...
  receipt?: string;
}

export class RazorpayService {
  private readonly base = "https://api.razorpay.com/v1";

  private get auth(): string {
    return (
      "Basic " +
      Buffer.from(
        `${config.razorpay.keyId}:${config.razorpay.keySecret}`
      ).toString("base64")
    );
  }

  async createSubscription(userId: string): Promise<RazorpaySubscription> {
    if (!config.razorpay.planId) {
      throw new AppError(
        "RAZORPAY_PLAN_ID is not configured",
        ErrorCode.SERVICE_UNAVAILABLE,
        500,
      );
    }

    const res = await fetch(`${this.base}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.auth,
      },
      body: JSON.stringify({
        plan_id: config.razorpay.planId,
        total_count: 1,
        customer_notify: 1,
        notes: { userId },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      if (res.status === 401) {
        throw new AppError(
          "Razorpay authentication failed",
          ErrorCode.UNAUTHORIZED,
          401,
        );
      }
      throw new AppError(
        `Razorpay createSubscription failed: ${res.status} ${err}`,
        ErrorCode.SERVICE_UNAVAILABLE,
        500,
      );
    }

    const data = (await res.json()) as RazorpaySubscription;
    return data;
  }

  verifySubscriptionSignature(
    subscriptionId: string,
    paymentId: string,
    signature: string
  ): boolean {
    const body = `${paymentId}|${subscriptionId}`;
    const expected = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body)
      .digest("hex");
    return expected === signature;
  }

  // One-time order creation — UPI works on orders (unlike subscriptions for this business category).
  async createOrder(
    amountPaise: number,
    receipt: string,
    notes: Record<string, string> = {},
  ): Promise<RazorpayOrder> {
    const res = await fetch(`${this.base}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.auth,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,
        notes,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      if (res.status === 401) {
        throw new AppError(
          "Razorpay authentication failed",
          ErrorCode.UNAUTHORIZED,
          401,
        );
      }
      throw new AppError(
        `Razorpay createOrder failed: ${res.status} ${err}`,
        ErrorCode.SERVICE_UNAVAILABLE,
        500,
      );
    }

    return (await res.json()) as RazorpayOrder;
  }

  verifyOrderSignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body)
      .digest("hex");
    return expected === signature;
  }

  verifyOrderWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = config.razorpay.orderWebhookSecret || config.razorpay.webhookSecret;
    if (!secret) return false;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return expected === signature;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!config.razorpay.webhookSecret) return false;
    const expected = crypto
      .createHmac("sha256", config.razorpay.webhookSecret)
      .update(rawBody)
      .digest("hex");
    return expected === signature;
  }
}
