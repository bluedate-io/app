import { type NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { logger } from "@/utils/logger";
import type { RazorpayWebhookEvent } from "@/services/PaymentService";

const log = logger.child("PaymentWebhook");

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const valid = container.razorpayService.verifyWebhookSignature(rawBody, signature);
  if (!valid) {
    log.warn("Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  log.info("Razorpay webhook received", { event: event.event });

  try {
    await container.paymentService.handleWebhook(event);
  } catch (err) {
    log.error("Webhook handler error", { err });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
