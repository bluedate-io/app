// ─── RazorpayService ──────────────────────────────────────────────────────────

import crypto from "crypto";
import { config } from "@/config";

export interface RazorpaySubscription {
  id: string;
  status: string; // "created" | "authenticated" | "active" | "pending" | "halted" | "cancelled" | "completed" | "expired"
  current_start?: number;
  current_end?: number;
  charge_at?: number;
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

  async createSubscription(
    userId: string
  ): Promise<{ subscriptionId: string }> {
    const res = await fetch(`${this.base}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.auth,
      },
      body: JSON.stringify({
        plan_id: config.razorpay.planId,
        total_count: 120,
        quantity: 1,
        notes: { userId },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Razorpay createSubscription failed: ${res.status} ${err}`);
    }

    const data = (await res.json()) as { id: string };
    return { subscriptionId: data.id };
  }

  async getSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
    const res = await fetch(`${this.base}/subscriptions/${subscriptionId}`, {
      headers: { Authorization: this.auth },
    });

    if (!res.ok) {
      throw new Error(`Razorpay getSubscription failed: ${res.status}`);
    }

    return res.json() as Promise<RazorpaySubscription>;
  }

  verifyPaymentSignature(
    paymentId: string,
    subscriptionId: string,
    signature: string
  ): boolean {
    const body = `${paymentId}|${subscriptionId}`;
    const expected = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body)
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
