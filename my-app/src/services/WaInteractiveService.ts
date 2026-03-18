// ─── WaInteractiveService ─────────────────────────────────────────────────────
// Sends WhatsApp messages via Twilio REST API.
// Supports plain text, quick-reply buttons (≤3), and list-picker (≤10).
//
// KEY: WhatsApp Content API requires STATIC button/item labels — variables are
// only allowed in the body text. Templates are cached by their label fingerprint.

import twilio from "twilio";
import { config } from "@/config";
import { logger } from "@/utils/logger";

const log = logger.child("WaInteractiveService");

// ─── Message types ────────────────────────────────────────────────────────────

export type WaTextMsg = { type: "text"; body: string };

export type WaButtonsMsg = {
  type: "buttons";
  body: string;
  buttons: string[]; // 2–3 items, labels are sent as-is (static in template)
};

export type WaListMsg = {
  type: "list";
  body: string;
  items: string[]; // 2–10 items
  buttonLabel?: string;
};

export type WaMessage = WaTextMsg | WaButtonsMsg | WaListMsg;

// ─── Service ──────────────────────────────────────────────────────────────────

export class WaInteractiveService {
  private readonly client: ReturnType<typeof twilio>;
  private readonly from: string;
  /** friendlyName → contentSid */
  private readonly sidCache = new Map<string, string>();

  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    this.from = config.twilio.whatsappNumber;
  }

  async send(to: string, msg: WaMessage): Promise<void> {
    if (msg.type === "text") {
      await this.client.messages.create({ from: this.from, to, body: msg.body });
      return;
    }

    try {
      const sid =
        msg.type === "buttons"
          ? await this.ensureButtonTemplate(msg.buttons)
          : await this.ensureListTemplate(msg.items, msg.buttonLabel);

      await this.client.messages.create({
        from: this.from,
        to,
        contentSid: sid,
        // Only the body is a variable ({{1}}); labels are baked into the template
        contentVariables: JSON.stringify({ "1": msg.body }),
      });

      log.info("Interactive message sent", { to, type: msg.type });
    } catch (err) {
      log.error("Interactive send failed, falling back to plain text", {
        err: err instanceof Error ? err.message : String(err),
      });
      await this.client.messages.create({
        from: this.from,
        to,
        body: this.toPlainText(msg),
      });
    }
  }

  // ─── Plain-text fallback ─────────────────────────────────────────────────

  private toPlainText(msg: WaMessage): string {
    if (msg.type === "text") return msg.body;
    const items = msg.type === "buttons" ? msg.buttons : msg.items;
    const opts = items.map((item, i) => `${i + 1}. ${item}`).join("\n");
    return `${msg.body}\n\n${opts}`;
  }

  // ─── Template key ────────────────────────────────────────────────────────
  // Fingerprint based on the actual label strings (since labels must be static)

  private labelKey(labels: string[]): string {
    return labels
      .map((l) => l.toLowerCase().replace(/[^a-z0-9]/g, ""))
      .join("_");
  }

  // ─── Quick-reply (≤3 buttons) ────────────────────────────────────────────

  private async ensureButtonTemplate(buttons: string[]): Promise<string> {
    const friendlyName = `bluedate_qr_${this.labelKey(buttons)}`;
    const cached = this.sidCache.get(friendlyName);
    if (cached) return cached;

    const existing = await this.findTemplate(friendlyName);
    if (existing) {
      this.sidCache.set(friendlyName, existing);
      return existing;
    }

    // Build template via raw REST — avoids SDK class import issues across versions
    const sid = await this.createTemplate(friendlyName, {
      types: {
        "twilio/quick-reply": {
          body: "{{1}}",
          actions: buttons.map((label) => ({ title: label, id: label })),
        },
      },
      variables: { "1": "body" },
    });

    this.sidCache.set(friendlyName, sid);
    log.info("Created quick-reply template", { friendlyName, sid, buttons });
    return sid;
  }

  // ─── List-picker (≤10 items) ─────────────────────────────────────────────

  private async ensureListTemplate(
    items: string[],
    buttonLabel = "Choose",
  ): Promise<string> {
    const friendlyName = `bluedate_list_${this.labelKey(items)}`;
    const cached = this.sidCache.get(friendlyName);
    if (cached) return cached;

    const existing = await this.findTemplate(friendlyName);
    if (existing) {
      this.sidCache.set(friendlyName, existing);
      return existing;
    }

    const sid = await this.createTemplate(friendlyName, {
      types: {
        "twilio/list-picker": {
          body: "{{1}}",
          button: buttonLabel,
          items: items.map((label) => ({ item: label, id: label })),
        },
      },
      variables: { "1": "body" },
    });

    this.sidCache.set(friendlyName, sid);
    log.info("Created list-picker template", { friendlyName, sid, items });
    return sid;
  }

  // ─── Create template via raw Twilio REST ─────────────────────────────────
  // Using raw fetch avoids SDK class version mismatches; the Content API
  // endpoint is stable: POST /v1/Content

  private async createTemplate(
    friendlyName: string,
    body: {
      types: Record<string, unknown>;
      variables: Record<string, string>;
    },
  ): Promise<string> {
    const url = "https://content.twilio.com/v1/Content";
    const payload = {
      friendly_name: friendlyName,
      language: "en",
      variables: body.variables,
      types: body.types,
    };

    const credentials = Buffer.from(
      `${config.twilio.accountSid}:${config.twilio.authToken}`,
    ).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Content API ${res.status}: ${text}`);
    }

    const json = (await res.json()) as { sid: string };
    return json.sid;
  }

  // ─── Find existing template by friendlyName ──────────────────────────────

  private async findTemplate(friendlyName: string): Promise<string | null> {
    try {
      const credentials = Buffer.from(
        `${config.twilio.accountSid}:${config.twilio.authToken}`,
      ).toString("base64");

      const res = await fetch(
        `https://content.twilio.com/v1/Content?PageSize=200`,
        {
          headers: { Authorization: `Basic ${credentials}` },
        },
      );

      if (!res.ok) return null;

      const json = (await res.json()) as {
        contents?: Array<{ sid: string; friendly_name: string }>;
      };

      const found = json.contents?.find(
        (c) => c.friendly_name === friendlyName,
      );
      return found?.sid ?? null;
    } catch {
      return null;
    }
  }
}
