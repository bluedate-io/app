// ─── PayPalService ────────────────────────────────────────────────────────────
// Thin wrapper around the PayPal REST API (production).

import { config } from "@/config";

export interface PayPalSubscription {
  id: string;
  status: string; // "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED"
  start_time?: string;
  billing_info?: {
    next_billing_time?: string;
  };
}

export class PayPalService {
  private readonly base = config.paypal.baseUrl;

  async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(
      `${config.paypal.clientId}:${config.paypal.clientSecret}`
    ).toString("base64");

    const res = await fetch(`${this.base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      throw new Error(`PayPal auth failed: ${res.status}`);
    }

    const data = await res.json() as { access_token: string };
    return data.access_token;
  }

  async createSubscription(
    userId: string,
    returnUrl: string,
    cancelUrl: string
  ): Promise<{ subscriptionId: string; approvalUrl: string }> {
    const token = await this.getAccessToken();

    const res = await fetch(`${this.base}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        plan_id: config.paypal.planId,
        subscriber: { custom_id: userId },
        application_context: {
          brand_name: "Bluedate",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`PayPal createSubscription failed: ${res.status} ${err}`);
    }

    const data = await res.json() as {
      id: string;
      links: Array<{ rel: string; href: string }>;
    };

    const approvalLink = data.links.find((l) => l.rel === "approve");
    if (!approvalLink) {
      throw new Error("PayPal response missing approve link");
    }

    return { subscriptionId: data.id, approvalUrl: approvalLink.href };
  }

  async getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
    const token = await this.getAccessToken();

    const res = await fetch(
      `${this.base}/v1/billing/subscriptions/${subscriptionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      throw new Error(`PayPal getSubscription failed: ${res.status}`);
    }

    return res.json() as Promise<PayPalSubscription>;
  }

  async verifyWebhookSignature(
    headers: Record<string, string>,
    rawBody: string,
    parsedBody: unknown
  ): Promise<void> {
    void rawBody; // kept for future use if PayPal changes verification method
    if (!config.paypal.webhookId) {
      throw new Error("PAYPAL_WEBHOOK_ID is not configured");
    }
    const token = await this.getAccessToken();

    const res = await fetch(
      `${this.base}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auth_algo: headers["paypal-auth-algo"],
          cert_url: headers["paypal-cert-url"],
          transmission_id: headers["paypal-transmission-id"],
          transmission_sig: headers["paypal-transmission-sig"],
          transmission_time: headers["paypal-transmission-time"],
          webhook_id: config.paypal.webhookId,
          webhook_event: parsedBody,
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`PayPal webhook verify request failed: ${res.status}`);
    }

    const data = await res.json() as { verification_status: string };
    if (data.verification_status !== "SUCCESS") {
      throw new Error(`Webhook signature invalid: ${data.verification_status}`);
    }
  }
}
