// ─── PaymentController ────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import type { RequestContext } from "@/types";
import type { PaymentService, RazorpayWebhookEvent } from "@/services/PaymentService";
import type { RazorpayService } from "@/services/RazorpayService";
import { successResponse, handleError } from "@/utils/response";
import { logger } from "@/utils/logger";

const log = logger.child("PaymentController");

export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly razorpayService: RazorpayService,
  ) {}

  // POST /api/payment/subscribe — returns { subscriptionId, keyId }
  async subscribe(_req: NextRequest, ctx: RequestContext) {
    try {
      const result = await this.paymentService.initiateSubscription(ctx.userId);
      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/payment/verify — verify first payment from Razorpay checkout
  async verifyPayment(req: NextRequest, ctx: RequestContext) {
    try {
      const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } =
        await req.json() as {
          razorpay_subscription_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        };

      if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ success: false, error: "Missing payment fields" }, { status: 400 });
      }

      await this.paymentService.verifyFirstPayment(
        razorpay_subscription_id,
        razorpay_payment_id,
        razorpay_signature,
      );

      log.info("Payment verified", { userId: ctx.userId, razorpay_subscription_id });
      return successResponse({ activated: true });
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/webhooks/razorpay
  async razorpayWebhook(req: NextRequest) {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";

    if (!this.razorpayService.verifyWebhookSignature(rawBody, signature)) {
      log.warn("Razorpay webhook signature invalid");
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }

    let parsed: RazorpayWebhookEvent;
    try {
      parsed = JSON.parse(rawBody) as RazorpayWebhookEvent;
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    try {
      await this.paymentService.handleWebhook(parsed);
    } catch (err) {
      log.error("Webhook processing error", { event: parsed.event, err });
      return NextResponse.json({ error: "processing failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  // POST /api/payment/order — create one-time Razorpay order (UPI-enabled)
  async createOrder(_req: NextRequest, ctx: RequestContext) {
    try {
      const result = await this.paymentService.initiateOrder(ctx.userId);
      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/payment/order/verify — verify checkout response for an order payment
  async verifyOrder(req: NextRequest, ctx: RequestContext) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        await req.json() as {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        };

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ success: false, error: "Missing payment fields" }, { status: 400 });
      }

      const result = await this.paymentService.verifyOrderPayment(
        ctx.userId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      );

      log.info("Order payment verified", { userId: ctx.userId, razorpay_order_id });
      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  // POST /api/webhooks/razorpay-orders — webhook for order/payment events
  async razorpayOrderWebhook(req: NextRequest) {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";

    if (!this.razorpayService.verifyOrderWebhookSignature(rawBody, signature)) {
      log.warn("Razorpay orders webhook signature invalid");
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }

    let parsed: RazorpayWebhookEvent;
    try {
      parsed = JSON.parse(rawBody) as RazorpayWebhookEvent;
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    try {
      await this.paymentService.handleOrderWebhook(parsed);
    } catch (err) {
      log.error("Orders webhook processing error", { event: parsed.event, err });
      return NextResponse.json({ error: "processing failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }
}
