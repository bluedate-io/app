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
    userId: string,
    receipt?: string
  ): Promise<{ orderId: string }> {
    if (!Number.isInteger(amount) || amount < 100) {
      throw new AppError(
        "Amount must be at least ₹1 (100 paise)",
        ErrorCode.VALIDATION_ERROR,
        400,
      );
    }

    const res = await fetch(`${this.base}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.auth,
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: receipt ?? `rcpt_${userId.slice(-8)}_${Date.now()}`,
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
        `Razorpay createOrder failed: ${res.status} ${err}`,
        ErrorCode.SERVICE_UNAVAILABLE,
        500,
      );
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
