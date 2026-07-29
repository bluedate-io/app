// ─── PaymentController ────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import type { RequestContext } from "@/types";
import type { PaymentService, PayPalWebhookEvent } from "@/services/PaymentService";
import type { PayPalService } from "@/services/PayPalService";
import { successResponse, handleError } from "@/utils/response";
import { config } from "@/config";
import { logger } from "@/utils/logger";

const log = logger.child("PaymentController");

export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly payPalService: PayPalService,
  ) {}

  // POST /api/payment/subscribe — authenticated; returns { approvalUrl }
  async subscribe(_req: NextRequest, ctx: RequestContext) {
    try {
      const result = await this.paymentService.initiateSubscription(ctx.userId);
      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  // GET /api/payment/success?subscription_id=I-XXX — PayPal redirect
  async successRedirect(req: NextRequest) {
    const subscriptionId = req.nextUrl.searchParams.get("subscription_id") ?? "";

    if (subscriptionId) {
      try {
        await this.paymentService.activateFromRedirect(subscriptionId);
      } catch (err) {
        log.error("Failed to activate subscription on redirect", { subscriptionId, err });
      }
    }

    return NextResponse.redirect(new URL("/payment/success", config.app.url));
  }

  // GET /api/payment/cancel — PayPal redirect when user cancels
  cancelRedirect(_req: NextRequest) {
    return NextResponse.redirect(new URL("/payment/cancel", config.app.url));
  }

  // POST /api/webhooks/paypal
  async paypalWebhook(req: NextRequest) {
    const rawBody = await req.text();
    let parsed: PayPalWebhookEvent;

    try {
      parsed = JSON.parse(rawBody) as PayPalWebhookEvent;
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const headers: Record<string, string> = {
      "paypal-auth-algo": req.headers.get("paypal-auth-algo") ?? "",
      "paypal-cert-url": req.headers.get("paypal-cert-url") ?? "",
      "paypal-transmission-id": req.headers.get("paypal-transmission-id") ?? "",
      "paypal-transmission-sig": req.headers.get("paypal-transmission-sig") ?? "",
      "paypal-transmission-time": req.headers.get("paypal-transmission-time") ?? "",
    };

    try {
      await this.payPalService.verifyWebhookSignature(headers, rawBody, parsed);
    } catch (err) {
      log.warn("Webhook signature verification failed", { err });
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }

    try {
      await this.paymentService.handleWebhook(parsed);
    } catch (err) {
      log.error("Webhook processing error", { event_type: parsed.event_type, err });
      return NextResponse.json({ error: "processing failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }
}
