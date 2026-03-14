// ─── POST /api/webhooks/whatsapp ──────────────────────────────────────────────
// Twilio sends incoming WhatsApp messages here as application/x-www-form-urlencoded.
// We validate the Twilio signature, run the bot state machine, and reply with TwiML.

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { container } from "@/lib/container";
import { config } from "@/config";

function twiml(message: string): NextResponse {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Parse form body
  const text = await req.text();
  const params = Object.fromEntries(new URLSearchParams(text));

  // Twilio signature validation — skipped in dev, enforced in production
  if (config.isProd) {
    const authToken = config.twilio.authToken;
    const signature = req.headers.get("x-twilio-signature") ?? "";
    const webhookUrl = process.env.WEBHOOK_BASE_URL
      ? `${process.env.WEBHOOK_BASE_URL}/api/webhooks/whatsapp`
      : `${config.app.url}/api/webhooks/whatsapp`;

    const valid = twilio.validateRequest(authToken, signature, webhookUrl, params);
    if (!valid) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const from: string = params["From"] ?? "";
  const body: string = params["Body"] ?? "";
  const mediaUrl: string | undefined = params["MediaUrl0"];
  const mediaContentType: string | undefined = params["MediaContentType0"];

  if (!from) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const reply = await container.whatsAppBotService.handleMessage(
    from,
    body,
    mediaUrl,
    mediaContentType,
  );

  return twiml(reply);
}
