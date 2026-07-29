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

  async createOrder(
    amount: number,
    userId: string
  ): Promise<{ orderId: string }> {
    const res = await fetch(`${this.base}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.auth,
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        notes: { userId },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Razorpay createOrder failed: ${res.status} ${err}`);
    }

    const data = (await res.json()) as { id: string };
    return { orderId: data.id };
  }

  verifyOrderSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    const body = `${orderId}|${paymentId}`;
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
